"use server";

import * as Sentry from "@sentry/nextjs";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/workspaces/context";
import { logTaskActivity } from "@/lib/tasks/activity";
import { hashInviteToken } from "@/lib/workspaces/invite-token";

function settingsUrl(params?: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/settings?${qs}` : "/settings";
}

export async function createWorkspaceInviteAction(formData: FormData) {
  const maxUsesRaw = String(formData.get("maxUses") ?? "5");
  const maxUses = Number.isFinite(Number(maxUsesRaw)) ? Math.max(1, Math.min(50, Math.floor(Number(maxUsesRaw)))) : 5;
  const roleRaw = String(formData.get("role") ?? "member");
  const role = roleRaw === "owner" ? "owner" : "member";

  const ctx = await requireWorkspaceContext();
  if (ctx.role !== "owner") {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "forbidden",
      message: "Forbidden: create invite",
      metadata: { action: "create_workspace_invite", role, maxUses }
    }).catch(() => {});
    redirect(settingsUrl({ invite: "forbidden" }));
  }

  const token = randomBytes(16).toString("hex");
  const tokenHash = hashInviteToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await prisma.workspaceInvite.create({
      data: {
        workspaceId: ctx.workspaceId,
        tokenHash,
        role,
        createdByUserId: ctx.userId,
        expiresAt,
        maxUses
      }
    });
    // Show the raw invite link only once (right after creation).
    // The raw token is NOT stored in DB.
    cookies().set("new_invite_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60,
      path: "/"
    });
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "workspace_invite_created",
      message: `Invite created (role=${role}, maxUses=${maxUses})`,
      metadata: { action: "create_workspace_invite", role, maxUses }
    }).catch(() => {});
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "workspace", action: "createInvite" } });
    redirect(settingsUrl({ invite: "failed" }));
  }

  revalidatePath("/settings");
  redirect(settingsUrl({ invite: "created" }));
}

export async function clearNewInviteTokenAction() {
  cookies().set("new_invite_token", "", { maxAge: 0, path: "/" });
  redirect("/settings");
}

export async function updateWorkspaceMemberRoleAction(formData: FormData) {
  const targetUserId = String(formData.get("userId") ?? "");
  const roleRaw = String(formData.get("role") ?? "");
  const nextRole = roleRaw === "owner" ? "owner" : roleRaw === "member" ? "member" : null;
  if (!targetUserId || !nextRole) return;

  const ctx = await requireWorkspaceContext();
  if (ctx.role !== "owner") {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "forbidden",
      message: "Forbidden: update member role",
      metadata: { action: "update_workspace_member_role", targetUserId, nextRole }
    }).catch(() => {});
    redirect(settingsUrl({ member: "forbidden" }));
  }
  // Prevent self role change (avoids accidental lock-out).
  if (targetUserId === ctx.userId) {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "forbidden",
      message: "Forbidden: change own role",
      metadata: { action: "update_workspace_member_role", targetUserId, nextRole, reason: "self_change" }
    }).catch(() => {});
    redirect(settingsUrl({ member: "self_forbidden" }));
  }

  const membership = await prisma.workspaceMembership.findUnique({
    where: { workspaceId_userId: { workspaceId: ctx.workspaceId, userId: targetUserId } },
    select: { role: true }
  });
  if (!membership) {
    redirect(settingsUrl({ member: "not_found" }));
  }

  // Prevent removing the last owner.
  if (membership.role === "owner" && nextRole !== "owner") {
    const ownerCount = await prisma.workspaceMembership.count({
      where: { workspaceId: ctx.workspaceId, role: "owner" }
    });
    if (ownerCount <= 1) {
      redirect(settingsUrl({ member: "last_owner" }));
    }
  }

  try {
    await prisma.workspaceMembership.update({
      where: { workspaceId_userId: { workspaceId: ctx.workspaceId, userId: targetUserId } },
      data: { role: nextRole }
    });
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "workspace_member_role_updated",
      message: `Member role updated (userId=${targetUserId}, role=${nextRole})`,
      metadata: { action: "update_workspace_member_role", targetUserId, nextRole }
    }).catch(() => {});
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "workspace", action: "updateMemberRole" } });
    redirect(settingsUrl({ member: "failed" }));
  }

  revalidatePath("/settings");
  redirect(settingsUrl({ member: "updated" }));
}

export async function revokeWorkspaceInviteAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const ctx = await requireWorkspaceContext();
  if (ctx.role !== "owner") {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "forbidden",
      message: "Forbidden: revoke invite",
      metadata: { action: "revoke_workspace_invite", inviteId: id }
    }).catch(() => {});
    redirect(settingsUrl({ invite: "forbidden" }));
  }

  try {
    await prisma.workspaceInvite.updateMany({
      where: { id, workspaceId: ctx.workspaceId },
      data: { revokedAt: new Date() }
    });
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "workspace_invite_revoked",
      message: `Invite revoked (id=${id})`,
      metadata: { action: "revoke_workspace_invite", inviteId: id }
    }).catch(() => {});
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "workspace", action: "revokeInvite" } });
    redirect(settingsUrl({ invite: "failed" }));
  }

  revalidatePath("/settings");
  redirect(settingsUrl({ invite: "revoked" }));
}

export async function switchWorkspaceAction(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  if (!workspaceId) return;

  const ctx = await requireWorkspaceContext();

  // Ensure the user is a member of the target workspace.
  const membership = await prisma.workspaceMembership.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: ctx.userId } },
    select: { id: true }
  });
  if (!membership) {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "forbidden",
      message: "Forbidden: switch workspace",
      metadata: { action: "switch_workspace", targetWorkspaceId: workspaceId }
    }).catch(() => {});
    redirect(settingsUrl({ workspace: "forbidden" }));
  }

  await prisma.user.update({
    where: { id: ctx.userId },
    data: { defaultWorkspaceId: workspaceId }
  });

  revalidatePath("/inbox");
  revalidatePath("/weekly");
  revalidatePath("/settings");
  redirect("/inbox");
}


