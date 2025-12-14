"use server";

import { revalidatePath } from "next/cache";

import { createTask, createTasksBulk, deleteTask, toggleTaskDone } from "@/lib/tasks/store";
import { requireUserId } from "@/lib/auth/user";

export async function createTaskAction(formData: FormData) {
  const title = String(formData.get("title") ?? "");
  const userId = await requireUserId();
  await createTask({ userId, title, source: "inbox" });
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


