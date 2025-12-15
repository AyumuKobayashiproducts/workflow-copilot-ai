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
  const body = (await req.json().catch(() => ({}))) as { inviteToken?: string };
  const inviteToken = String(body.inviteToken ?? "").trim();
  if (!inviteToken) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const invite = await prisma.workspaceInvite.findFirst({
    where: { workspaceId: ctx.workspaceId, token: inviteToken, revokedAt: null },
    select: { id: true }
  });
  if (!invite) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  if (ctx.role !== "owner") {
    await logTaskActivity({
      workspaceId: ctx.workspaceId,
      actorUserId: ctx.userId,
      kind: "forbidden",
      message: "Forbidden: revoke invite (e2e)",
      metadata: { action: "revoke_workspace_invite", inviteId: invite.id }
    }).catch(() => {});
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  await prisma.workspaceInvite.updateMany({
    where: { id: invite.id, workspaceId: ctx.workspaceId },
    data: { revokedAt: new Date() }
  });

  await logTaskActivity({
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.userId,
    kind: "workspace_invite_revoked",
    message: `Invite revoked (id=${invite.id})`,
    metadata: { action: "revoke_workspace_invite", inviteId: invite.id, via: "e2e" }
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}


