"use server";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const AUTH_BYPASS_ENABLED = process.env.AUTH_BYPASS === "1";
const TEST_OWNER_ID = "test-user";
const TEST_MEMBER_ID = "test-member";
const TEST_WORKSPACE_ID = "e2e-workspace";

export async function POST(req: Request) {
  if (!AUTH_BYPASS_ENABLED) {
    return NextResponse.json({ ok: false, error: "disabled" }, { status: 404 });
  }

  const token = req.headers.get("x-e2e-token") ?? "";
  const expected = process.env.E2E_TOKEN ?? "e2e";
  if (!token || token !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    // Create E2E users + workspace (stable IDs).
    await prisma.user.upsert({
      where: { id: TEST_OWNER_ID },
      update: {},
      create: { id: TEST_OWNER_ID, email: "test-user@example.com", name: "Test User" }
    });
    await prisma.user.upsert({
      where: { id: TEST_MEMBER_ID },
      update: {},
      create: { id: TEST_MEMBER_ID, email: "test-member@example.com", name: "Test Member" }
    });

    await prisma.workspace.upsert({
      where: { id: TEST_WORKSPACE_ID },
      update: { name: "E2E Workspace" },
      create: { id: TEST_WORKSPACE_ID, name: "E2E Workspace" }
    });

    await prisma.workspaceMembership.upsert({
      where: { workspaceId_userId: { workspaceId: TEST_WORKSPACE_ID, userId: TEST_OWNER_ID } },
      update: { role: "owner" },
      create: { workspaceId: TEST_WORKSPACE_ID, userId: TEST_OWNER_ID, role: "owner" }
    });
    await prisma.workspaceMembership.upsert({
      where: { workspaceId_userId: { workspaceId: TEST_WORKSPACE_ID, userId: TEST_MEMBER_ID } },
      update: { role: "member" },
      create: { workspaceId: TEST_WORKSPACE_ID, userId: TEST_MEMBER_ID, role: "member" }
    });

    // Ensure both users operate in the same default workspace.
    await prisma.user.update({ where: { id: TEST_OWNER_ID }, data: { defaultWorkspaceId: TEST_WORKSPACE_ID } });
    await prisma.user.update({ where: { id: TEST_MEMBER_ID }, data: { defaultWorkspaceId: TEST_WORKSPACE_ID } });

    // Reset workspace-scoped data used by E2E flows.
    await prisma.taskActivity.deleteMany({ where: { workspaceId: TEST_WORKSPACE_ID } });
    await prisma.task.deleteMany({ where: { workspaceId: TEST_WORKSPACE_ID } });
    await prisma.weeklyNote.deleteMany({ where: { workspaceId: TEST_WORKSPACE_ID } });
    await prisma.weeklyReport.deleteMany({ where: { workspaceId: TEST_WORKSPACE_ID } });
    await prisma.aiUsage.deleteMany({ where: { workspaceId: TEST_WORKSPACE_ID } });
    await prisma.workspaceInvite.deleteMany({ where: { workspaceId: TEST_WORKSPACE_ID } });
  } catch {
    // When DATABASE_URL isn't configured, Prisma throws before any test can run.
    // Return a clear JSON error to make local debugging easier.
    const dbConfigured = Boolean(process.env.DATABASE_URL);
    return NextResponse.json(
      {
        ok: false,
        error: "db_not_configured",
        message: dbConfigured ? "Database error (see server logs)" : "DATABASE_URL is not set",
        hint: "Configure DATABASE_URL / PRISMA_DATABASE_URL in .env.local and restart the dev server."
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}


