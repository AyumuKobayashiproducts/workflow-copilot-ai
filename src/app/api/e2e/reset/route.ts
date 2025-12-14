"use server";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const AUTH_BYPASS_ENABLED = process.env.AUTH_BYPASS === "1";
const TEST_USER_ID = "test-user";

export async function POST(req: Request) {
  if (!AUTH_BYPASS_ENABLED) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }

  const token = req.headers.get("x-e2e-token") ?? "";
  const expected = process.env.E2E_TOKEN ?? "e2e";
  if (!token || token !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // Reset all user-scoped data used by E2E flows.
  await prisma.task.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.weeklyNote.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.weeklyReport.deleteMany({ where: { userId: TEST_USER_ID } });
  await prisma.aiUsage.deleteMany({ where: { userId: TEST_USER_ID } });

  return NextResponse.json({ ok: true });
}


