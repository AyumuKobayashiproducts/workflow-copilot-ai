"use server";

import * as Sentry from "@sentry/nextjs";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearFocusTask,
  createTask,
  createTasksBulk,
  deleteTask,
  setFocusTask,
  toggleTaskDone,
  updateTaskTitle
} from "@/lib/tasks/store";
import { requireWorkspaceContext } from "@/lib/workspaces/context";

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
  await createTask({ workspaceId: ctx.workspaceId, userId: ctx.userId, title, source: "inbox" });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function createWeeklyTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const ctx = await requireWorkspaceContext();
  await createTask({ workspaceId: ctx.workspaceId, userId: ctx.userId, title, source: "weekly" });
  revalidatePath("/weekly");
  revalidatePath("/inbox");
}

export async function toggleTaskDoneAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const ctx = await requireWorkspaceContext();
  await toggleTaskDone({ workspaceId: ctx.workspaceId, userId: ctx.userId, id });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function deleteTaskAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const ctx = await requireWorkspaceContext();
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
    await clearFocusTask({ workspaceId: ctx.workspaceId, userId: ctx.userId });
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
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}


