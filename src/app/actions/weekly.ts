"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getWeeklyNote, setWeeklyNote } from "@/lib/weekly/store";
import { requireUserId } from "@/lib/auth/user";
import { listTasks } from "@/lib/tasks/store";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { consumeAiUsage } from "@/lib/ai/usage";

export async function saveWeeklyNoteAction(formData: FormData) {
  const weekStart = String(formData.get("weekStart") ?? "");
  const note = String(formData.get("note") ?? "");
  if (!weekStart) return;
  const userId = await requireUserId();
  await setWeeklyNote({ userId, weekStartIso: weekStart, note });
  revalidatePath("/weekly");
}

export async function generateWeeklyReportText(
  weekStartIso: string
): Promise<{ ok: true; text: string } | { ok: false; reason: "rate_limited" | "failed" }> {
  const userId = await requireUserId();
  const locale = await getLocale();

  const weekStart = new Date(weekStartIso);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const startLabel = weekStart.toLocaleDateString(locale);
  const endLabel = weekEnd.toLocaleDateString(locale);

  const tasks = await listTasks(userId);
  const inWeek = tasks.filter((task) => {
    const created = task.createdAt.getTime();
    return created >= weekStart.getTime() && created <= weekEnd.getTime();
  });
  const doneCount = inWeek.filter((x) => x.status === "done").length;
  const todoCount = inWeek.filter((x) => x.status === "todo").length;
  const blockedCount = 0;

  const note = await getWeeklyNote({ userId, weekStartIso });

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  // If AI is not configured, return a deterministic text (still useful).
  if (!apiKey) {
    const text = [
      `Weekly report (${startLabel} - ${endLabel})`,
      `Completed: ${doneCount}`,
      `In progress: ${todoCount}`,
      `Blocked: ${blockedCount}`,
      "",
      note ? `Notes: ${note}` : ""
    ]
      .filter(Boolean)
      .join("\n");
    return { ok: true, text };
  }

  const quota = await consumeAiUsage({ userId, kind: "weekly" });
  if (!quota.ok) return { ok: false, reason: "rate_limited" };

  const language = locale === "ja" ? "Japanese" : "English";
  const system = [
    `Write a concise weekly report in ${language}.`,
    "Format:",
    "- 1 title line",
    "- 3 bullet points: Highlights, Challenges, Next week",
    "Keep it short (max 8 lines).",
    "No markdown code blocks."
  ].join(" ");

  const user = [
    `Range: ${startLabel} - ${endLabel}`,
    `Completed: ${doneCount}`,
    `In progress: ${todoCount}`,
    `Blocked: ${blockedCount}`,
    `Notes: ${note || "(none)"}`
  ].join("\n");

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });
    if (!res.ok) return { ok: false, reason: "failed" };
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = (data.choices?.[0]?.message?.content ?? "").trim();
    if (!content) return { ok: false, reason: "failed" };
    return { ok: true, text: content.slice(0, 2000) };
  } catch {
    return { ok: false, reason: "failed" };
  }
}

export async function postWeeklyToSlackAction(formData: FormData) {
  const weekStartIso = String(formData.get("weekStart") ?? "");
  if (!weekStartIso) return;

  const userId = await requireUserId();

  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    redirect(`/weekly?slack=not_configured`);
  }
  if (webhookUrl === "mock") {
    redirect(`/weekly?slack=posted`);
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

  const note = await getWeeklyNote({ userId, weekStartIso });
  const reportFromClient = String(formData.get("report") ?? "").trim();
  const report =
    reportFromClient ||
    (await (async () => {
      const gen = await generateWeeklyReportText(weekStartIso);
      return gen.ok ? gen.text : "";
    })());

  const text = [
    `*${t("slack.weekly.title")}*`,
    `${t("slack.weekly.range")}: ${startLabel} - ${endLabel}`,
    `${t("slack.weekly.completed")}: ${doneCount}`,
    `${t("slack.weekly.inProgress")}: ${todoCount}`,
    `${t("slack.weekly.blocked")}: ${blockedCount}`,
    report ? "" : "",
    report ? report : "",
    note ? "" : "",
    note ? `Notes: ${note}` : "",
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


