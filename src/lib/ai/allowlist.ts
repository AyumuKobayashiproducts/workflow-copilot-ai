import { prisma } from "@/lib/db";

function parseCsvLower(raw: string | undefined): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function parseCsv(raw: string | undefined): string[] {
  return String(raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * AI allowlist gate to prevent unexpected API costs in public demos.
 *
 * - If no allowlist env is set, AI is DISABLED (deny by default).
 * - If allowlist is set, only matching users can trigger OpenAI calls.
 *
 * Env vars:
 * - AI_ALLOW_EMAILS: comma-separated emails (case-insensitive)
 * - AI_ALLOW_USER_IDS: comma-separated user ids (exact match)
 */
export async function isAiAllowedUser(input: { userId: string }): Promise<boolean> {
  const allowEmails = parseCsvLower(process.env.AI_ALLOW_EMAILS);
  const allowUserIds = parseCsv(process.env.AI_ALLOW_USER_IDS);

  // Safety default for public deployments: deny if not configured.
  if (allowEmails.length === 0 && allowUserIds.length === 0) return false;

  if (allowUserIds.includes(input.userId)) return true;
  if (allowEmails.length === 0) return false;

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { email: true }
  });
  const email = String(user?.email ?? "").trim().toLowerCase();
  if (!email) return false;
  return allowEmails.includes(email);
}


