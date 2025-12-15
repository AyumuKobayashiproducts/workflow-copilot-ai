"use server";

import * as Sentry from "@sentry/nextjs";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getWeeklyNote, setWeeklyNote, setWeeklyReport } from "@/lib/weekly/store";
import { requireWorkspaceContext } from "@/lib/workspaces/context";
import { listTasks } from "@/lib/tasks/store";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { consumeAiUsage } from "@/lib/ai/usage";

const WEEKLY_NOTE_MAX_CHARS = 500;
const WEEKLY_REPORT_MAX_CHARS = 2000;

function weeklyUrl(weekStartIso: string, params?: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  if (weekStartIso) sp.set("weekStart", weekStartIso);
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/weekly?${qs}` : "/weekly";
}

export async function saveWeeklyNoteAction(formData: FormData) {
  const weekStart = String(formData.get("weekStart") ?? "");
  const noteRaw = String(formData.get("note") ?? "");
  if (!weekStart || Number.isNaN(new Date(weekStart).getTime())) {
    Sentry.captureMessage("Invalid weekStart for saveWeeklyNoteAction", {
      level: "warning",
      tags: { feature: "weekly", action: "saveNote" }
    });
    redirect(weeklyUrl(weekStart, { note: "failed" }));
  }
  const ctx = await requireWorkspaceContext();
  const note = noteRaw.trim().slice(0, WEEKLY_NOTE_MAX_CHARS + 1);
  if (note.length > WEEKLY_NOTE_MAX_CHARS) {
    redirect(weeklyUrl(weekStart, { note: "too_long" }));
  }
  await setWeeklyNote({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso: weekStart, note });
  revalidatePath("/weekly");
  redirect(weeklyUrl(weekStart, { note: "saved" }));
}

export async function saveWeeklyReportAction(formData: FormData) {
  const weekStartIso = String(formData.get("weekStart") ?? "");
  const reportRaw = String(formData.get("report") ?? "");
  if (!weekStartIso || Number.isNaN(new Date(weekStartIso).getTime())) {
    Sentry.captureMessage("Invalid weekStart for saveWeeklyReportAction", {
      level: "warning",
      tags: { feature: "weekly", action: "saveReport" }
    });
    redirect(weeklyUrl(weekStartIso, { report: "failed" }));
  }
  const ctx = await requireWorkspaceContext();
  const text = reportRaw.trim().slice(0, WEEKLY_REPORT_MAX_CHARS + 1);
  if (text.length > WEEKLY_REPORT_MAX_CHARS) {
    redirect(weeklyUrl(weekStartIso, { report: "too_long" }));
  }
  await setWeeklyReport({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso, text });
  revalidatePath("/weekly");
  redirect(weeklyUrl(weekStartIso, { report: "saved" }));
}

function formatWeeklyReport(params: {
  locale: string;
  startLabel: string;
  endLabel: string;
  doneCount: number;
  todoCount: number;
  blockedCount: number;
  note: string;
  raw: string;
}): string {
  const isJa = params.locale === "ja";
  const defaultTitle = isJa
    ? `週報（${params.startLabel} - ${params.endLabel}）`
    : `Weekly report (${params.startLabel} - ${params.endLabel})`;

  const labelHighlights = isJa ? "ハイライト" : "Highlights";
  const labelChallenges = isJa ? "課題" : "Challenges";
  const labelNext = isJa ? "来週" : "Next week";

  const raw = (params.raw ?? "").replace(/\r\n/g, "\n").trim();
  if (!raw) {
    const notePart = params.note?.trim() ? (isJa ? `メモ: ${params.note.trim()}` : `Notes: ${params.note.trim()}`) : "";
    return [
      defaultTitle,
      `- ${labelHighlights}: ${isJa ? "完了" : "Completed"} ${params.doneCount}`,
      `- ${labelChallenges}: ${isJa ? "進行中" : "In progress"} ${params.todoCount}`,
      `- ${labelNext}: ${notePart || (isJa ? "次の一歩を1つ決める" : "Pick 1 next step")}`
    ]
      .filter(Boolean)
      .join("\n")
      .slice(0, WEEKLY_REPORT_MAX_CHARS);
  }

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.replace(/^#+\s*/, "")); // strip markdown headers

  const titleCandidate = lines[0] ?? "";
  const title =
    titleCandidate.length >= 2 && titleCandidate.length <= 80 ? titleCandidate : defaultTitle;

  const bulletCandidates = lines
    .slice(1)
    .map((l) => l.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  // Prefer labeled lines when present (e.g. "Highlights: ...")
  function pickByLabel(label: string) {
    const found = bulletCandidates.find((b) => b.toLowerCase().startsWith(label.toLowerCase()));
    if (!found) return null;
    const idx = found.indexOf(":");
    return (idx >= 0 ? found.slice(idx + 1) : found).trim() || null;
  }

  const hl = pickByLabel(labelHighlights) ?? bulletCandidates[0] ?? "";
  const ch = pickByLabel(labelChallenges) ?? bulletCandidates[1] ?? "";
  const nx = pickByLabel(labelNext) ?? bulletCandidates[2] ?? "";

  const safe = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 220);

  const bullets = [
    `- ${labelHighlights}: ${safe(hl) || (isJa ? `完了 ${params.doneCount}` : `Completed ${params.doneCount}`)}`,
    `- ${labelChallenges}: ${safe(ch) || (isJa ? `進行中 ${params.todoCount}` : `In progress ${params.todoCount}`)}`,
    `- ${labelNext}: ${safe(nx) || (isJa ? "次の一歩を1つ決める" : "Pick 1 next step")}`
  ];

  const out = [title, ...bullets].join("\n");
  return out.slice(0, WEEKLY_REPORT_MAX_CHARS);
}

export async function generateWeeklyReportText(
  weekStartIso: string,
  template: "standard" | "short" | "detailed" = "standard"
): Promise<{ ok: true; text: string } | { ok: false; reason: "rate_limited" | "failed" }> {
  const ctx = await requireWorkspaceContext();
  const locale = await getLocale();

  if (!weekStartIso || Number.isNaN(new Date(weekStartIso).getTime())) {
    return { ok: false, reason: "failed" };
  }

  const weekStart = new Date(weekStartIso);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const startLabel = weekStart.toLocaleDateString(locale);
  const endLabel = weekEnd.toLocaleDateString(locale);

  const tasks = await listTasks({ workspaceId: ctx.workspaceId, userId: ctx.userId });
  const inWeek = tasks.filter((task) => {
    const created = task.createdAt.getTime();
    return created >= weekStart.getTime() && created <= weekEnd.getTime();
  });
  const doneCount = inWeek.filter((x) => x.status === "done").length;
  const todoCount = inWeek.filter((x) => x.status === "todo").length;
  const blockedCount = 0;

  const note = await getWeeklyNote({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso });

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
    const formatted = formatWeeklyReport({
      locale,
      startLabel,
      endLabel,
      doneCount,
      todoCount,
      blockedCount,
      note,
      raw: text
    });
    await setWeeklyReport({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso, text: formatted });
    return {
      ok: true,
      text: formatted
    };
  }

  const quota = await consumeAiUsage({ workspaceId: ctx.workspaceId, userId: ctx.userId, kind: "weekly" });
  if (!quota.ok) return { ok: false, reason: "rate_limited" };

  const language = locale === "ja" ? "Japanese" : "English";
  const styleHint =
    template === "short"
      ? "Make it very short (max 5 lines)."
      : template === "detailed"
        ? "Add a bit more detail (max 12 lines)."
        : "Keep it short (max 8 lines).";
  const system = [
    `Write a weekly report in ${language}.`,
    "Format:",
    "- 1 title line",
    "- 3 bullet points: Highlights, Challenges, Next week",
    styleHint,
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
    async function callOnce() {
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
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        // eslint-disable-next-line no-console
        console.error("OpenAI weekly failed", { status: res.status, body: body.slice(0, 400) });
        Sentry.captureMessage("OpenAI weekly failed", {
          level: "error",
          tags: { feature: "weekly", provider: "openai" },
          extra: { status: res.status }
        });
        return null;
      }
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = (data.choices?.[0]?.message?.content ?? "").trim();
      if (!content) return null;
      return formatWeeklyReport({
        locale,
        startLabel,
        endLabel,
        doneCount,
        todoCount,
        blockedCount,
        note,
        raw: content
      });
    }

    const first = await callOnce();
    if (first) {
      await setWeeklyReport({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso, text: first });
      return { ok: true, text: first };
    }
    const second = await callOnce();
    if (second) {
      await setWeeklyReport({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso, text: second });
      return { ok: true, text: second };
    }
    return { ok: false, reason: "failed" };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("OpenAI weekly exception");
    Sentry.captureException(err);
    return { ok: false, reason: "failed" };
  }
}

export async function postWeeklyToSlackAction(formData: FormData) {
  const weekStartIso = String(formData.get("weekStart") ?? "");
  if (!weekStartIso) return;

  const ctx = await requireWorkspaceContext();

  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    Sentry.captureMessage("Slack webhook not configured", {
      level: "warning",
      tags: { feature: "weekly", provider: "slack" }
    });
    redirect(weeklyUrl(weekStartIso, { slack: "not_configured" }));
  }
  if (webhookUrl === "mock") {
    // Give the client a moment to enter a pending state (prevents flaky E2E around double-submit).
    await new Promise((r) => setTimeout(r, 400));
    redirect(weeklyUrl(weekStartIso, { slack: "posted" }));
  }

  const weekStart = new Date(weekStartIso);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const tasks = await listTasks({ workspaceId: ctx.workspaceId, userId: ctx.userId });
  const inWeek = tasks.filter((task) => {
    const created = task.createdAt.getTime();
    return created >= weekStart.getTime() && created <= weekEnd.getTime();
  });
  const doneCount = inWeek.filter((x) => x.status === "done").length;
  const todoCount = inWeek.filter((x) => x.status === "todo").length;
  const blockedCount = 0;

  const startLabel = weekStart.toLocaleDateString(locale);
  const endLabel = weekEnd.toLocaleDateString(locale);

  const note = await getWeeklyNote({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso });
  const reportFromClient = String(formData.get("report") ?? "").trim();
  const report =
    reportFromClient ||
    (await (async () => {
      const gen = await generateWeeklyReportText(weekStartIso);
      return gen.ok ? gen.text : "";
    })());

  const fallbackText = [
    `${t("slack.weekly.title")} (${startLabel} - ${endLabel})`,
    `${t("slack.weekly.completed")}: ${doneCount}`,
    `${t("slack.weekly.inProgress")}: ${todoCount}`,
    `${t("slack.weekly.blocked")}: ${blockedCount}`
  ].join(" | ");

  const blocks = [
    {
      type: "header",
      text: { type: "plain_text", text: t("slack.weekly.title") }
    },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*${t("slack.weekly.range")}*\n${startLabel} - ${endLabel}` },
        { type: "mrkdwn", text: `*${t("slack.weekly.completed")}*\n${doneCount}` },
        { type: "mrkdwn", text: `*${t("slack.weekly.inProgress")}*\n${todoCount}` },
        { type: "mrkdwn", text: `*${t("slack.weekly.blocked")}*\n${blockedCount}` }
      ]
    },
    ...(report
      ? [
          { type: "divider" },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*${t("slack.weekly.report")}*\n${report}` }
          }
        ]
      : []),
    ...(note
      ? [
          { type: "divider" },
          {
            type: "section",
            text: { type: "mrkdwn", text: `*${t("slack.weekly.notes")}*\n${note}` }
          }
        ]
      : [])
  ];

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: fallbackText, blocks })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      const bodyTrimmed = body.trim();
      const lower = bodyTrimmed.toLowerCase();

      let slackReason: "rateLimited" | "invalidPayload" | "invalidToken" | "invalidWebhook" | "unknown" = "unknown";
      if (res.status === 429 || lower.includes("rate_limited")) slackReason = "rateLimited";
      else if (lower.includes("invalid_payload")) slackReason = "invalidPayload";
      else if (lower.includes("invalid_token") || lower.includes("invalid_auth")) slackReason = "invalidToken";
      else if (res.status === 404 || res.status === 410 || lower.includes("no_service")) slackReason = "invalidWebhook";

      // eslint-disable-next-line no-console
      console.error("Slack webhook failed", {
        status: res.status,
        body: bodyTrimmed.slice(0, 200),
        slackReason
      });
      Sentry.captureMessage("Slack webhook failed", {
        level: "error",
        tags: { feature: "weekly", provider: "slack" },
        extra: { status: res.status, slackReason }
      });
      redirect(weeklyUrl(weekStartIso, { slack: "failed", slackReason }));
    }
  } catch (err) {
    Sentry.captureException(err);
    redirect(weeklyUrl(weekStartIso, { slack: "failed" }));
  }

  redirect(weeklyUrl(weekStartIso, { slack: "posted" }));
}


