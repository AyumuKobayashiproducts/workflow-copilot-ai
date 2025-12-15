import { prisma } from "@/lib/db";

export async function getWeeklyNote(input: {
  workspaceId: string;
  userId: string;
  weekStartIso: string;
}): Promise<string> {
  const weekStart = new Date(input.weekStartIso);
  const row = await prisma.weeklyNote.findUnique({
    where: { workspaceId_userId_weekStart: { workspaceId: input.workspaceId, userId: input.userId, weekStart } }
  });
  return row?.note ?? "";
}

export async function setWeeklyNote(input: {
  workspaceId: string;
  userId: string;
  weekStartIso: string;
  note: string;
}): Promise<void> {
  const weekStart = new Date(input.weekStartIso);
  await prisma.weeklyNote.upsert({
    where: { workspaceId_userId_weekStart: { workspaceId: input.workspaceId, userId: input.userId, weekStart } },
    update: { note: input.note },
    create: { workspaceId: input.workspaceId, userId: input.userId, weekStart, note: input.note }
  });
}

export async function getWeeklyReport(input: {
  workspaceId: string;
  userId: string;
  weekStartIso: string;
}): Promise<string> {
  const weekStart = new Date(input.weekStartIso);
  const row = await prisma.weeklyReport.findUnique({
    where: { workspaceId_userId_weekStart: { workspaceId: input.workspaceId, userId: input.userId, weekStart } }
  });
  return row?.text ?? "";
}

export async function setWeeklyReport(input: {
  workspaceId: string;
  userId: string;
  weekStartIso: string;
  text: string;
}): Promise<void> {
  const weekStart = new Date(input.weekStartIso);
  await prisma.weeklyReport.upsert({
    where: { workspaceId_userId_weekStart: { workspaceId: input.workspaceId, userId: input.userId, weekStart } },
    update: { text: input.text },
    create: { workspaceId: input.workspaceId, userId: input.userId, weekStart, text: input.text }
  });
}


