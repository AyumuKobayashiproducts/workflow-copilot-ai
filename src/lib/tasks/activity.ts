import type { Prisma, TaskActivityKind } from "@prisma/client";

import { prisma } from "@/lib/db";

export async function listTaskActivities(input: {
  workspaceId: string;
  taskId: string;
  take?: number;
}) {
  const take = Math.max(1, Math.min(100, input.take ?? 50));
  return prisma.taskActivity.findMany({
    where: { workspaceId: input.workspaceId, taskId: input.taskId },
    orderBy: { createdAt: "desc" },
    take,
    include: { actor: { select: { id: true, name: true, email: true } } }
  });
}

export async function listWorkspaceActivities(input: { workspaceId: string; take?: number; kind?: TaskActivityKind }) {
  const take = Math.max(1, Math.min(100, input.take ?? 20));
  return prisma.taskActivity.findMany({
    where: { workspaceId: input.workspaceId, ...(input.kind ? { kind: input.kind } : {}) },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { id: true, name: true, email: true } },
      task: { select: { id: true, title: true } }
    }
  });
}

export async function logTaskActivity(input: {
  workspaceId: string;
  taskId?: string;
  actorUserId: string;
  kind: TaskActivityKind;
  message?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.taskActivity.create({
    data: {
      workspaceId: input.workspaceId,
      taskId: input.taskId,
      actorUserId: input.actorUserId,
      kind: input.kind,
      message: input.message,
      metadata: input.metadata
    }
  });
}


