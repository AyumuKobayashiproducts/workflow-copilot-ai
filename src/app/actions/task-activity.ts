"use server";

import * as Sentry from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/workspaces/context";
import { logTaskActivity } from "@/lib/tasks/activity";

function safeTaskUrl(taskId: string) {
  return taskId ? `/tasks/${encodeURIComponent(taskId)}` : "/inbox";
}

export async function addTaskCommentAction(formData: FormData) {
  const taskId = String(formData.get("taskId") ?? "");
  const messageRaw = String(formData.get("message") ?? "");
  if (!taskId) return;

  const ctx = await requireWorkspaceContext();
  const message = messageRaw.trim().slice(0, 500);
  if (!message) {
    redirect(`${safeTaskUrl(taskId)}?comment=empty`);
  }

  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId: ctx.workspaceId },
    select: { id: true }
  });
  if (!task) redirect("/inbox");

  try {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      taskId,
      actorUserId: ctx.userId,
      kind: "comment",
      message
    });
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "taskActivity", action: "addComment" } });
    redirect(`${safeTaskUrl(taskId)}?comment=failed`);
  }

  revalidatePath(`/tasks/${taskId}`);
  redirect(safeTaskUrl(taskId));
}


