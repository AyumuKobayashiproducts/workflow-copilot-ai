"use server";

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/workspaces/context";
import { logTaskActivity } from "@/lib/tasks/activity";

const AUTH_BYPASS_ENABLED = process.env.AUTH_BYPASS === "1";

export async function POST(req: Request) {
  if (!AUTH_BYPASS_ENABLED) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }

  const token = req.headers.get("x-e2e-token") ?? "";
  const expected = process.env.E2E_TOKEN ?? "e2e";
  if (!token || token !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ctx = await requireWorkspaceContext();

  if (ctx.role !== "owner") {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "forbidden",
      message: "Forbidden: create invite (e2e)",
      metadata: { action: "create_workspace_invite" }
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { role?: string; maxUses?: number };
  const role = body.role === "owner" ? "owner" : "member";
  const maxUses = Number.isFinite(Number(body.maxUses)) ? Math.max(1, Math.min(50, Math.floor(Number(body.maxUses)))) : 5;

  const tokenValue = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.workspaceInvite.create({
    data: {
      workspaceId: ctx.workspaceId,
      token: tokenValue,
      role,
      createdByUserId: ctx.userId,
      expiresAt,
      maxUses
    }
  });

  return NextResponse.json({ ok: true, token: tokenValue });
}


