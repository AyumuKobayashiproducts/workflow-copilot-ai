"use server";

import * as Sentry from "@sentry/nextjs";

import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { requireWorkspaceContext } from "@/lib/workspaces/context";
import { consumeAiUsage } from "@/lib/ai/usage";

type Result =
  | { ok: true; steps: string[] }
  | {
      ok: false;
      reason: "empty_goal" | "goal_too_long" | "not_configured" | "rate_limited" | "failed";
    };

function pickJsonArray(text: string): string | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function parseSteps(text: string): string[] {
  const raw = text.trim();
  const jsonCandidate = raw.startsWith("[") ? raw : pickJsonArray(raw);
  if (!jsonCandidate) throw new Error("No JSON array found");
  const parsed = JSON.parse(jsonCandidate);
  if (!Array.isArray(parsed)) throw new Error("JSON is not an array");
  const steps = parsed.map((s) => String(s).trim()).filter(Boolean);
  if (steps.length === 0) throw new Error("No steps");
  return steps.slice(0, 10);
}

export async function generateBreakdownSteps(goal: string): Promise<Result> {
  const trimmed = (goal ?? "").trim();
  if (!trimmed) return { ok: false, reason: "empty_goal" };
  if (trimmed.length > 300) return { ok: false, reason: "goal_too_long" };

  // Require auth in prod; in CI we can bypass with AUTH_BYPASS.
  const ctx = await requireWorkspaceContext();
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback steps so the feature remains useful without AI configured.
    return {
      ok: true,
      steps: [
        t("breakdown.generated.step1").replace("{goal}", trimmed),
        t("breakdown.generated.step2"),
        t("breakdown.generated.step3"),
        t("breakdown.generated.step4"),
        t("breakdown.generated.step5")
      ]
    };
  }

  const quota = await consumeAiUsage({ workspaceId: ctx.workspaceId, userId: ctx.userId, kind: "breakdown" });
  if (!quota.ok) return { ok: false, reason: "rate_limited" };

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const language = locale === "ja" ? "Japanese" : "English";

  // NOTE: prompt strings are server-side only (not UI).
  const system = [
    `You are a product coach. Write concise, actionable task steps in ${language}.`,
    "Return ONLY valid JSON: an array of strings.",
    "Each step should be a single short sentence.",
    "No numbering, no markdown, no extra keys.",
    "Prefer 5 to 7 steps."
  ].join(" ");

  const user = `Goal: ${trimmed}`;

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
        console.error("OpenAI breakdown failed", { status: res.status, body: body.slice(0, 400) });
        Sentry.captureMessage("OpenAI breakdown failed", {
          level: "error",
          tags: { feature: "breakdown", provider: "openai" },
          extra: { status: res.status }
        });
        return null;
      }

      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const content = data.choices?.[0]?.message?.content ?? "";
      try {
        return parseSteps(content);
      } catch {
        // eslint-disable-next-line no-console
        console.error("OpenAI breakdown parse failed", { content: content.slice(0, 400) });
        Sentry.captureMessage("OpenAI breakdown parse failed", {
          level: "error",
          tags: { feature: "breakdown", provider: "openai" }
        });
        return null;
      }
    }

    const first = await callOnce();
    if (first) return { ok: true, steps: first };

    // One retry for transient errors / formatting issues
    const second = await callOnce();
    if (second) return { ok: true, steps: second };

    return { ok: false, reason: "failed" };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("OpenAI breakdown exception");
    Sentry.captureException(err);
    return { ok: false, reason: "failed" };
  }
}


