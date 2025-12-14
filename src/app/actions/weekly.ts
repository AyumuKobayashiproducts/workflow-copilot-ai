"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { setWeeklyNote } from "@/lib/weekly/store";
import { auth } from "@/auth";
import { listTasks } from "@/lib/tasks/store";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

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

export async function postWeeklyToSlackAction(formData: FormData) {
  const weekStartIso = String(formData.get("weekStart") ?? "");
  if (!weekStartIso) return;

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");

  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    redirect(`/weekly?slack=not_configured`);
  }

  const weekStart = new Date(weekStartIso);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const tasks = await listTasks(userId);
  const inWeek = tasks.filter((task) => {
    const created = task.createdAt.getTime();
    return created >= weekStart.getTime() && created <= weekEnd.getTime();
  });
  const doneCount = inWeek.filter((x) => x.status === "done").length;
  const todoCount = inWeek.filter((x) => x.status === "todo").length;
  const blockedCount = 0;

  const startLabel = weekStart.toLocaleDateString(locale);
  const endLabel = weekEnd.toLocaleDateString(locale);

  const text = [
    `*${t("slack.weekly.title")}*`,
    `${t("slack.weekly.range")}: ${startLabel} - ${endLabel}`,
    `${t("slack.weekly.completed")}: ${doneCount}`,
    `${t("slack.weekly.inProgress")}: ${todoCount}`,
    `${t("slack.weekly.blocked")}: ${blockedCount}`,
    ""
  ].join("\n");

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) {
      redirect(`/weekly?slack=failed`);
    }
  } catch {
    redirect(`/weekly?slack=failed`);
  }

  redirect(`/weekly?slack=posted`);
}


