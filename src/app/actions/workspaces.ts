"use server";

import * as Sentry from "@sentry/nextjs";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/workspaces/context";

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

  const ctx = await requireWorkspaceContext();
  if (ctx.role !== "owner") {
    redirect(settingsUrl({ invite: "forbidden" }));
  }

  const token = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    await prisma.workspaceInvite.create({
      data: {
        workspaceId: ctx.workspaceId,
        token,
        role: "member",
        createdByUserId: ctx.userId,
        expiresAt,
        maxUses
      }
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "workspace", action: "createInvite" } });
    redirect(settingsUrl({ invite: "failed" }));
  }

  revalidatePath("/settings");
  redirect(settingsUrl({ invite: "created" }));
}

export async function revokeWorkspaceInviteAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const ctx = await requireWorkspaceContext();
  if (ctx.role !== "owner") {
    redirect(settingsUrl({ invite: "forbidden" }));
  }

  try {
    await prisma.workspaceInvite.updateMany({
      where: { id, workspaceId: ctx.workspaceId },
      data: { revokedAt: new Date() }
    });
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


