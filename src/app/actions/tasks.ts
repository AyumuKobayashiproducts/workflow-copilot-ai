"use server";

import * as Sentry from "@sentry/nextjs";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  assignTask,
  clearFocusTask,
  createTask,
  createTasksBulk,
  deleteTask,
  setFocusTask,
  toggleTaskDone,
  updateTaskTitle
} from "@/lib/tasks/store";
import { requireWorkspaceContext } from "@/lib/workspaces/context";
import { logTaskActivity } from "@/lib/tasks/activity";
import { prisma } from "@/lib/db";

function safeRedirectTo(raw: string | null): string {
  const v = (raw ?? "").trim();
  if (!v.startsWith("/")) return "/inbox";
  return v;
}

function addQueryParam(path: string, key: string, value: string) {
  const [p, qs = ""] = path.split("?");
  const sp = new URLSearchParams(qs);
  sp.set(key, value);
  const out = sp.toString();
  return out ? `${p}?${out}` : p;
}

export async function createTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const ctx = await requireWorkspaceContext();
  const created = await createTask({ workspaceId: ctx.workspaceId, userId: ctx.userId, title, source: "inbox" });
  await logTaskActivity({
    workspaceId: ctx.workspaceId,
    taskId: created.id,
    actorUserId: ctx.userId,
    kind: "created",
    metadata: { source: "inbox" }
  });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function assignTaskAction(formData: FormData) {
  const taskId = String(formData.get("id") ?? "");
  const assignee = String(formData.get("assignedToUserId") ?? "");
  if (!taskId || !assignee) return;

  const ctx = await requireWorkspaceContext();
  await assignTask({ workspaceId: ctx.workspaceId, taskId, assignedToUserId: assignee });
  await logTaskActivity({
    workspaceId: ctx.workspaceId,
    taskId,
    actorUserId: ctx.userId,
    kind: "assigned",
    metadata: { assignedToUserId: assignee }
  });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function createWeeklyTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const ctx = await requireWorkspaceContext();
  const created = await createTask({ workspaceId: ctx.workspaceId, userId: ctx.userId, title, source: "weekly" });
  await logTaskActivity({
    workspaceId: ctx.workspaceId,
    taskId: created.id,
    actorUserId: ctx.userId,
    kind: "created",
    metadata: { source: "weekly" }
  });
  revalidatePath("/weekly");
  revalidatePath("/inbox");
}

export async function toggleTaskDoneAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const ctx = await requireWorkspaceContext();
  await toggleTaskDone({ workspaceId: ctx.workspaceId, userId: ctx.userId, id });
  await logTaskActivity({
    workspaceId: ctx.workspaceId,
    taskId: id,
    actorUserId: ctx.userId,
    kind: "status_toggled"
  });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function deleteTaskAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const ctx = await requireWorkspaceContext();
  await logTaskActivity({
    workspaceId: ctx.workspaceId,
    taskId: id,
    actorUserId: ctx.userId,
    kind: "deleted"
  }).catch(() => {
    // If the task doesn't exist, skip audit logging.
  });
  await deleteTask({ workspaceId: ctx.workspaceId, userId: ctx.userId, id });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function updateTaskTitleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  if (!id) return;
  const ctx = await requireWorkspaceContext();
  const redirectTo = safeRedirectTo(String(formData.get("redirectTo") ?? ""));
  try {
    await updateTaskTitle({ workspaceId: ctx.workspaceId, userId: ctx.userId, id, title });
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      taskId: id,
      actorUserId: ctx.userId,
      kind: "title_updated"
    });
    revalidatePath("/inbox");
    revalidatePath("/weekly");
    redirect(addQueryParam(redirectTo, "toast", "task_updated"));
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "tasks", action: "updateTitle" } });
    redirect(addQueryParam(redirectTo, "toast", "task_update_failed"));
  }
}

export async function setFocusTaskAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const ctx = await requireWorkspaceContext();
  const redirectTo = safeRedirectTo(String(formData.get("redirectTo") ?? ""));
  try {
    await setFocusTask({ workspaceId: ctx.workspaceId, userId: ctx.userId, id });
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      taskId: id,
      actorUserId: ctx.userId,
      kind: "focus_set"
    });
    revalidatePath("/inbox");
    revalidatePath("/weekly");
    redirect(addQueryParam(redirectTo, "toast", "focus_set"));
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "tasks", action: "setFocus" } });
    redirect(addQueryParam(redirectTo, "toast", "focus_failed"));
  }
}

export async function clearFocusTaskAction(formData: FormData) {
  const ctx = await requireWorkspaceContext();
  const redirectTo = safeRedirectTo(String(formData.get("redirectTo") ?? ""));
  try {
    const current = await prisma.task.findFirst({
      where: {
        workspaceId: ctx.workspaceId,
        assignedToUserId: ctx.userId,
        status: "todo",
        focusAt: { not: null }
      },
      orderBy: [{ focusAt: "desc" }, { createdAt: "desc" }],
      select: { id: true }
    });
    await clearFocusTask({ workspaceId: ctx.workspaceId, userId: ctx.userId });
    if (current) {
      await logTaskActivity({
        workspaceId: ctx.workspaceId,
        taskId: current.id,
        actorUserId: ctx.userId,
        kind: "focus_cleared"
      });
    }
    revalidatePath("/inbox");
    revalidatePath("/weekly");
    redirect(addQueryParam(redirectTo, "toast", "focus_cleared"));
  } catch (err) {
    Sentry.captureException(err, { tags: { feature: "tasks", action: "clearFocus" } });
    redirect(addQueryParam(redirectTo, "toast", "focus_failed"));
  }
}

export async function createTasksFromBreakdownAction(formData: FormData) {
  const raw = String(formData.get("steps") ?? "");
  const steps = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (steps.length === 0) return;
  const ctx = await requireWorkspaceContext();
  await createTasksBulk({ workspaceId: ctx.workspaceId, userId: ctx.userId, titles: steps, source: "breakdown" });
  // Lightweight: do not log per-task activity for bulk creation in MVP.
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}


