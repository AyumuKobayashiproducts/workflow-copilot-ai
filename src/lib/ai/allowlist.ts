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
 * - If no allowlist env is set, AI is allowed for all authenticated users (backwards compatible).
 * - If allowlist is set, only matching users can trigger OpenAI calls.
 *
 * Env vars:
 * - AI_ALLOW_EMAILS: comma-separated emails (case-insensitive)
 * - AI_ALLOW_USER_IDS: comma-separated user ids (exact match)
 */
export async function isAiAllowedUser(input: { userId: string }): Promise<boolean> {
  const allowEmails = parseCsvLower(process.env.AI_ALLOW_EMAILS);
  const allowUserIds = parseCsv(process.env.AI_ALLOW_USER_IDS);

  // Backwards compatible default: allow all if not configured.
  if (allowEmails.length === 0 && allowUserIds.length === 0) return true;

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


