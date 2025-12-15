import { prisma } from "@/lib/db";
import { getUserIdOrNull, requireUserId } from "@/lib/auth/user";

export type WorkspaceContext = {
  userId: string;
  workspaceId: string;
  role: "owner" | "member";
  workspaceName: string;
};

async function ensureDefaultWorkspace(userId: string): Promise<WorkspaceContext> {
  // Fast path: user already has a default workspace.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { defaultWorkspaceId: true }
  });

  if (user?.defaultWorkspaceId) {
    const m = await prisma.workspaceMembership.findUnique({
      where: { workspaceId_userId: { workspaceId: user.defaultWorkspaceId, userId } },
      select: { role: true, workspace: { select: { id: true, name: true } } }
    });
    if (m) {
      return {
        userId,
        workspaceId: m.workspace.id,
        role: m.role,
        workspaceName: m.workspace.name
      };
    }
  }

  // Next: pick the first membership and set it as default.
  const first = await prisma.workspaceMembership.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { role: true, workspace: { select: { id: true, name: true } } }
  });
  if (first) {
    await prisma.user.update({
      where: { id: userId },
      data: { defaultWorkspaceId: first.workspace.id }
    });
    return {
      userId,
      workspaceId: first.workspace.id,
      role: first.role,
      workspaceName: first.workspace.name
    };
  }

  // First-time user: create a personal workspace + owner membership.
  const created = await prisma.$transaction(async (tx) => {
    const ws = await tx.workspace.create({
      data: { name: "Personal workspace" },
      select: { id: true, name: true }
    });
    const m = await tx.workspaceMembership.create({
      data: { workspaceId: ws.id, userId, role: "owner" },
      select: { role: true }
    });
    await tx.user.update({
      where: { id: userId },
      data: { defaultWorkspaceId: ws.id }
    });
    return { ws, m };
  });

  return {
    userId,
    workspaceId: created.ws.id,
    role: created.m.role,
    workspaceName: created.ws.name
  };
}

export async function getWorkspaceContextOrNull(): Promise<WorkspaceContext | null> {
  const userId = await getUserIdOrNull();
  if (!userId) return null;
  return ensureDefaultWorkspace(userId);
}

export async function requireWorkspaceContext(): Promise<WorkspaceContext> {
  const userId = await requireUserId();
  return ensureDefaultWorkspace(userId);
}


