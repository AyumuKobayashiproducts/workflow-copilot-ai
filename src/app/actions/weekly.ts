"use server";

import { revalidatePath } from "next/cache";

import { setWeeklyNote } from "@/lib/weekly/store";
import { auth } from "@/auth";

export async function saveWeeklyNoteAction(formData: FormData) {
  const weekStart = String(formData.get("weekStart") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!weekStart) return;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  await setWeeklyNote({ userId, weekStartIso: weekStart, note });
  revalidatePath("/weekly");
}


