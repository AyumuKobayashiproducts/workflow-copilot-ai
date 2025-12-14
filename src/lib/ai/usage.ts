import { prisma } from "@/lib/db";

export type AiUsageKind = "breakdown" | "weekly";

function utcDateKey(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getDailyLimit() {
  const raw = process.env.AI_DAILY_LIMIT;
  const n = raw ? Number(raw) : 20;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 20;
}

export async function consumeAiUsage(input: { userId: string; kind: AiUsageKind }) {
  const date = utcDateKey(new Date());
  const limit = getDailyLimit();

  // Atomic-ish: do it inside a transaction.
  const next = await prisma.$transaction(async (tx) => {
    const row = await tx.aiUsage.upsert({
      where: { userId_date_kind: { userId: input.userId, date, kind: input.kind } },
      update: { count: { increment: 1 } },
      create: { userId: input.userId, date, kind: input.kind, count: 1 }
    });
    return row;
  });

  if (next.count > limit) {
    // Roll back one increment so the counter represents successful uses.
    await prisma.aiUsage.update({
      where: { id: next.id },
      data: { count: { decrement: 1 } }
    });
    return { ok: false as const, limit, used: limit };
  }

  return { ok: true as const, limit, used: next.count };
}


