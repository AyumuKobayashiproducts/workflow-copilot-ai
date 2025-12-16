import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getUserIdOrNull } from "@/lib/auth/user";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { hashInviteToken } from "@/lib/workspaces/invite-token";
import { Prisma } from "@prisma/client";

export default async function InviteAcceptPage(props: { params: Promise<{ token: string }> }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const { token } = await props.params;
  const tokenSafe = (token ?? "").trim();
  if (!tokenSafe) redirect("/login");

  const userId = await getUserIdOrNull();
  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/invite/${tokenSafe}`)}`);
  }

  const tokenHash = hashInviteToken(tokenSafe);
  const invite = await prisma.workspaceInvite.findUnique({
    where: { tokenHash },
    include: { workspace: { select: { id: true, name: true } } }
  });

  if (!invite || invite.revokedAt) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("invite.title")}</h1>
          <p className="text-sm text-neutral-700">{t("invite.invalid")}</p>
        </header>
        <Link className="text-sm underline underline-offset-4" href="/settings">
          {t("invite.goToSettings")}
        </Link>
      </div>
    );
  }

  const now = Date.now();
  if (invite.expiresAt && invite.expiresAt.getTime() < now) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("invite.title")}</h1>
          <p className="text-sm text-neutral-700">{t("invite.expired")}</p>
        </header>
        <Link className="text-sm underline underline-offset-4" href="/settings">
          {t("invite.goToSettings")}
        </Link>
      </div>
    );
  }
  if (invite.usedCount >= invite.maxUses) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("invite.title")}</h1>
          <p className="text-sm text-neutral-700">{t("invite.usedUp")}</p>
        </header>
        <Link className="text-sm underline underline-offset-4" href="/settings">
          {t("invite.goToSettings")}
        </Link>
      </div>
    );
  }

  // Accept: lock invite row to avoid race conditions around maxUses/usedCount.
  let accepted = false;
  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{
        id: string;
        workspaceId: string;
        role: "owner" | "member";
        usedCount: number;
        maxUses: number;
        revokedAt: Date | null;
        expiresAt: Date | null;
      }>
    >`
      SELECT "id","workspaceId","role","usedCount","maxUses","revokedAt","expiresAt"
      FROM "WorkspaceInvite"
      WHERE "id" = ${invite.id}
      FOR UPDATE
    `;
    const locked = rows[0];
    if (!locked || locked.revokedAt) return;
    const now = new Date();
    if (locked.expiresAt && locked.expiresAt.getTime() < now.getTime()) return;
    if (locked.usedCount >= locked.maxUses) return;

    // If already a member, don't consume a use.
    const existing = await tx.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId: locked.workspaceId, userId } },
      select: { id: true }
    });
    if (existing) {
      accepted = true;
      return;
    }

    try {
      await tx.workspaceMembership.create({
        data: { workspaceId: locked.workspaceId, userId, role: locked.role }
      });
    } catch (err) {
      // Idempotency: if concurrent accept already created membership, treat as accepted.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        accepted = true;
        return;
      }
      throw err;
    }

    const updatedInvite = await tx.workspaceInvite.update({
      where: { id: locked.id },
      data: { usedCount: { increment: 1 }, ...(locked.usedCount + 1 >= locked.maxUses ? { revokedAt: now } : {}) },
      select: { id: true, usedCount: true, maxUses: true, role: true }
    });

    // Audit (workspace event): invite accepted / member joined.
    await tx.taskActivity.create({
      data: {
        workspaceId: locked.workspaceId,
        taskId: null,
        actorUserId: userId,
        kind: "workspace_invite_accepted",
        message: `Invite accepted (role=${locked.role})`,
        metadata: { action: "accept_workspace_invite", inviteId: locked.id, role: locked.role }
      }
    });
    await tx.taskActivity.create({
      data: {
        workspaceId: locked.workspaceId,
        taskId: null,
        actorUserId: userId,
        kind: "workspace_member_joined",
        message: `Member joined (role=${locked.role})`,
        metadata: { action: "workspace_member_joined", inviteId: locked.id, role: locked.role }
      }
    });

    // Audit: invite usage count.
    await tx.taskActivity.create({
      data: {
        workspaceId: locked.workspaceId,
        taskId: null,
        actorUserId: userId,
        kind: "workspace_invite_used",
        message: `Invite used (${updatedInvite.usedCount}/${updatedInvite.maxUses})`,
        metadata: {
          action: "workspace_invite_used",
          inviteId: updatedInvite.id,
          usedCount: updatedInvite.usedCount,
          maxUses: updatedInvite.maxUses
        }
      }
    });
    if (updatedInvite.usedCount >= updatedInvite.maxUses) {
      await tx.taskActivity.create({
        data: {
          workspaceId: locked.workspaceId,
          taskId: null,
          actorUserId: userId,
          kind: "workspace_invite_used_up",
          message: "Invite used up",
          metadata: {
            action: "workspace_invite_used_up",
            inviteId: updatedInvite.id,
            usedCount: updatedInvite.usedCount,
            maxUses: updatedInvite.maxUses
          }
        }
      });
      await tx.taskActivity.create({
        data: {
          workspaceId: locked.workspaceId,
          taskId: null,
          actorUserId: userId,
          kind: "workspace_invite_revoked",
          message: "Invite auto-revoked (used up)",
          metadata: {
            action: "workspace_invite_auto_revoked",
            inviteId: updatedInvite.id,
            reason: "used_up",
            usedCount: updatedInvite.usedCount,
            maxUses: updatedInvite.maxUses
          }
        }
      });
    }

    accepted = true;

    // If the user has no default workspace yet, set it to this one.
    const u = await tx.user.findUnique({ where: { id: userId }, select: { defaultWorkspaceId: true } });
    if (!u?.defaultWorkspaceId) {
      await tx.user.update({ where: { id: userId }, data: { defaultWorkspaceId: locked.workspaceId } });
    }
  });

  if (!accepted) {
    // invite became invalid/expired/used up during the transaction
    redirect(`/invite/${encodeURIComponent(tokenSafe)}`);
  }

  redirect("/settings?invite=accepted");
}


