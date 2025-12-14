import type { Task, TaskStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

export type TaskSource = "inbox" | "breakdown";

export async function listTasks(userId: string): Promise<Task[]> {
  return prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
}

export async function createTask(input: {
  userId: string;
  title: string;
  source?: TaskSource;
}): Promise<Task> {
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required");

  return prisma.task.create({
    data: {
      userId: input.userId,
      title,
      source: input.source
    }
  });
}

export async function createTasksBulk(input: {
  userId: string;
  titles: string[];
  source?: TaskSource;
}): Promise<void> {
  const titles = input.titles.map((t) => t.trim()).filter(Boolean);
  if (titles.length === 0) return;

  await prisma.task.createMany({
    data: titles.map((title) => ({
      userId: input.userId,
      title,
      source: input.source
    }))
  });
}

export async function toggleTaskDone(input: { userId: string; id: string }): Promise<Task> {
  const task = await prisma.task.findFirst({
    where: { id: input.id, userId: input.userId }
  });
  if (!task) throw new Error("Task not found");

  const nextStatus: TaskStatus = task.status === "done" ? "todo" : "done";
  return prisma.task.update({
    where: { id: task.id },
    data: {
      status: nextStatus,
      completedAt: nextStatus === "done" ? new Date() : null
    }
  });
}

export async function deleteTask(input: { userId: string; id: string }): Promise<void> {
  await prisma.task.deleteMany({
    where: { id: input.id, userId: input.userId }
  });
}


