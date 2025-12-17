import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    // Minimal DB probe. Avoid leaking details while still proving connectivity.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, db: "ok", ms: Date.now() - startedAt, ts: new Date().toISOString() },
      {
        status: 200,
        headers: { "cache-control": "no-store" }
      }
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: "error", ts: new Date().toISOString() },
      {
        status: 503,
        headers: { "cache-control": "no-store" }
      }
    );
  }
}


