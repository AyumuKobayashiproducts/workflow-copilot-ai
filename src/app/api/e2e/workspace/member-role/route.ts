"use server";

import { NextResponse } from "next/server";

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
  const body = (await req.json().catch(() => ({}))) as { userId?: string; role?: string };
  const targetUserId = String(body.userId ?? "").trim();
  const nextRole = body.role === "owner" ? "owner" : body.role === "member" ? "member" : null;
  if (!targetUserId || !nextRole) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  if (ctx.role !== "owner") {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "forbidden",
      message: "Forbidden: update member role (e2e)",
      metadata: { action: "update_workspace_member_role", targetUserId, nextRole }
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Owner path (not required for the forbidden test, but keeps the endpoint complete).
  await prisma.workspaceMembership.update({
    where: { workspaceId_userId: { workspaceId: ctx.workspaceId, userId: targetUserId } },
    data: { role: nextRole }
  });

  await logTaskActivity({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    kind: "workspace_member_role_updated",
    message: `Member role updated (userId=${targetUserId}, role=${nextRole})`,
    metadata: { action: "update_workspace_member_role", targetUserId, nextRole, via: "e2e" }
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}


