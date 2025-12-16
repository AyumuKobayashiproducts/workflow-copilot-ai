import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { getUserIdOrNull } from "@/lib/auth/user";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { hashInviteToken } from "@/lib/workspaces/invite-token";

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

  // Accept: create membership if missing and increment used count.
  await prisma.$transaction(async (tx) => {
    const existing = await tx.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId } },
      select: { id: true }
    });
    if (!existing) {
      await tx.workspaceMembership.create({
        data: { workspaceId: invite.workspaceId, userId, role: invite.role }
      });
      const updatedInvite = await tx.workspaceInvite.update({
        where: { id: invite.id },
        data: { usedCount: { increment: 1 } },
        select: { id: true, usedCount: true, maxUses: true, role: true }
      });

      // Audit (workspace event): invite accepted / member joined.
      await tx.taskActivity.create({
        data: {
          workspaceId: invite.workspaceId,
          taskId: null,
          actorUserId: userId,
          kind: "workspace_invite_accepted",
          message: `Invite accepted (role=${invite.role})`,
          metadata: { action: "accept_workspace_invite", inviteId: invite.id, role: invite.role }
        }
      });
      await tx.taskActivity.create({
        data: {
          workspaceId: invite.workspaceId,
          taskId: null,
          actorUserId: userId,
          kind: "workspace_member_joined",
          message: `Member joined (role=${invite.role})`,
          metadata: { action: "workspace_member_joined", inviteId: invite.id, role: invite.role }
        }
      });

      // Audit: invite usage count.
      await tx.taskActivity.create({
        data: {
          workspaceId: invite.workspaceId,
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
        // Auto revoke when used up (prevents further acceptance even if counts race).
        await tx.workspaceInvite.updateMany({
          where: { id: updatedInvite.id, revokedAt: null },
          data: { revokedAt: new Date() }
        });

        await tx.taskActivity.create({
          data: {
            workspaceId: invite.workspaceId,
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
            workspaceId: invite.workspaceId,
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
    }

    // If the user has no default workspace yet, set it to this one.
    const u = await tx.user.findUnique({ where: { id: userId }, select: { defaultWorkspaceId: true } });
    if (!u?.defaultWorkspaceId) {
      await tx.user.update({ where: { id: userId }, data: { defaultWorkspaceId: invite.workspaceId } });
    }
  });

  redirect("/settings?invite=accepted");
}


