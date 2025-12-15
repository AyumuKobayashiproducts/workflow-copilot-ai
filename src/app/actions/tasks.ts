"use server";

import { revalidatePath } from "next/cache";

import {
  clearFocusTask,
  createTask,
  createTasksBulk,
  deleteTask,
  setFocusTask,
  toggleTaskDone,
  updateTaskTitle
} from "@/lib/tasks/store";
import { requireUserId } from "@/lib/auth/user";

export async function createTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const userId = await requireUserId();
  await createTask({ userId, title, source: "inbox" });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function createWeeklyTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const userId = await requireUserId();
  await createTask({ userId, title, source: "weekly" });
  revalidatePath("/weekly");
  revalidatePath("/inbox");
}

export async function toggleTaskDoneAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await requireUserId();
  await toggleTaskDone({ userId, id });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function deleteTaskAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await requireUserId();
  await deleteTask({ userId, id });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function updateTaskTitleAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  if (!id) return;
  const userId = await requireUserId();
  await updateTaskTitle({ userId, id, title });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function setFocusTaskAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const userId = await requireUserId();
  await setFocusTask({ userId, id });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function clearFocusTaskAction() {
  const userId = await requireUserId();
  await clearFocusTask({ userId });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}

export async function createTasksFromBreakdownAction(formData: FormData) {
  const raw = String(formData.get("steps") ?? "");
  const steps = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (steps.length === 0) return;
  const userId = await requireUserId();
  await createTasksBulk({ userId, titles: steps, source: "breakdown" });
  revalidatePath("/inbox");
  revalidatePath("/weekly");
}


