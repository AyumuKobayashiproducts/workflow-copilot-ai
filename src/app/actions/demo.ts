"use server";

import * as Sentry from "@sentry/nextjs";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireWorkspaceContext } from "@/lib/workspaces/context";

function ensureDemoToolsEnabled() {
  if (process.env.DEMO_TOOLS !== "1") {
    throw new Error("Demo tools are disabled");
  }
}

function ensureOwnerForDemo(ctx: { role: string }) {
  if (ctx.role !== "owner") {
    throw new Error("Forbidden: demo tools require owner role");
  }
}

async function seedDemoDataForUser(input: { workspaceId: string; userId: string }) {
  await prisma.aiUsage.deleteMany({ where: { workspaceId: input.workspaceId, userId: input.userId } });
  await prisma.task.deleteMany({ where: { workspaceId: input.workspaceId, userId: input.userId } });
  await prisma.weeklyNote.deleteMany({ where: { workspaceId: input.workspaceId, userId: input.userId } });
  await prisma.weeklyReport.deleteMany({ where: { workspaceId: input.workspaceId, userId: input.userId } });

  // Seed demo data for a nice first-run experience.
  const base = new Date();
  const day = base.getDay(); // 0 Sun ... 6 Sat
  const diffToMonday = (day + 6) % 7;
  const weekStart = new Date(base);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - diffToMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const now = new Date();
  const withinWeek = (daysFromStart: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + daysFromStart);
    d.setHours(9, 30, 0, 0);
    // keep ordering stable and within this week
    return d.getTime() > now.getTime() ? now : d;
  };

  await prisma.task.createMany({
    data: [
      {
        workspaceId: input.workspaceId,
        userId: input.userId,
        assignedToUserId: input.userId,
        title: "Write down today's top goal (10 min)",
        status: "done",
        source: "demo",
        createdAt: withinWeek(0),
        updatedAt: withinWeek(0),
        completedAt: withinWeek(0)
      },
      {
        workspaceId: input.workspaceId,
        userId: input.userId,
        assignedToUserId: input.userId,
        title: "Break it into 5 steps",
        status: "done",
        source: "demo",
        createdAt: withinWeek(1),
        updatedAt: withinWeek(1),
        completedAt: withinWeek(1)
      },
      {
        workspaceId: input.workspaceId,
        userId: input.userId,
        assignedToUserId: input.userId,
        title: "Do the smallest next step (10 min)",
        status: "todo",
        source: "demo",
        createdAt: withinWeek(2),
        updatedAt: withinWeek(2),
        focusAt: withinWeek(2)
      },
      {
        workspaceId: input.workspaceId,
        userId: input.userId,
        assignedToUserId: input.userId,
        title: "Share a weekly report to Slack",
        status: "todo",
        source: "demo",
        createdAt: withinWeek(3),
        updatedAt: withinWeek(3)
      }
    ]
  });

  await prisma.weeklyNote.upsert({
    where: { workspaceId_userId_weekStart: { workspaceId: input.workspaceId, userId: input.userId, weekStart } },
    update: { note: "Demo week: shipped core workflow + added monitoring." },
    create: { workspaceId: input.workspaceId, userId: input.userId, weekStart, note: "Demo week: shipped core workflow + added monitoring." }
  });

  await prisma.weeklyReport.upsert({
    where: { workspaceId_userId_weekStart: { workspaceId: input.workspaceId, userId: input.userId, weekStart } },
    update: {
      text: [
        `Weekly report (${weekStart.toLocaleDateString("en-US")} - ${weekEnd.toLocaleDateString("en-US")})`,
        "- Highlights: Implemented end-to-end workflow (Inbox → Breakdown → Weekly → Slack)",
        "- Challenges: Making AI outputs stable and user-safe",
        "- Next week: Polish UX + ship a public demo"
      ].join("\n")
    },
    create: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      weekStart,
      text: [
        `Weekly report (${weekStart.toLocaleDateString("en-US")} - ${weekEnd.toLocaleDateString("en-US")})`,
        "- Highlights: Implemented end-to-end workflow (Inbox → Breakdown → Weekly → Slack)",
        "- Challenges: Making AI outputs stable and user-safe",
        "- Next week: Polish UX + ship a public demo"
      ].join("\n")
    }
  });
}

async function clearDemoDataForUser(input: { workspaceId: string; userId: string }) {
  await prisma.aiUsage.deleteMany({ where: { workspaceId: input.workspaceId, userId: input.userId } });
  await prisma.task.deleteMany({ where: { workspaceId: input.workspaceId, userId: input.userId } });
  await prisma.weeklyNote.deleteMany({ where: { workspaceId: input.workspaceId, userId: input.userId } });
  await prisma.weeklyReport.deleteMany({ where: { workspaceId: input.workspaceId, userId: input.userId } });
}

function safeRedirectTo(raw: string | null): string {
  const v = (raw ?? "").trim();
  if (!v.startsWith("/")) return "/settings?demo=seeded";
  return v;
}

export async function seedMyDemoDataAction(formData: FormData) {
  ensureDemoToolsEnabled();
  const ctx = await requireWorkspaceContext();
  const redirectTo = safeRedirectTo(String(formData.get("redirectTo") ?? ""));

  try {
    ensureOwnerForDemo(ctx);
  } catch {
    const sep = redirectTo.includes("?") ? "&" : "?";
    redirect(`${redirectTo}${sep}demo=forbidden`);
  }

  try {
    await seedDemoDataForUser({ workspaceId: ctx.workspaceId, userId: ctx.userId });
  } catch (err) {
    Sentry.captureException(err);
    const sep = redirectTo.includes("?") ? "&" : "?";
    redirect(`${redirectTo}${sep}demo=failed`);
  }

  revalidatePath("/inbox");
  revalidatePath("/weekly");
  revalidatePath("/settings");
  revalidatePath("/");

  const sep = redirectTo.includes("?") ? "&" : "?";
  redirect(`${redirectTo}${sep}demo=seeded`);
}

export async function clearMyDemoDataAction(formData: FormData) {
  ensureDemoToolsEnabled();
  const ctx = await requireWorkspaceContext();
  const redirectTo = safeRedirectTo(String(formData.get("redirectTo") ?? ""));

  try {
    ensureOwnerForDemo(ctx);
  } catch {
    const sep = redirectTo.includes("?") ? "&" : "?";
    redirect(`${redirectTo}${sep}demo=forbidden`);
  }

  try {
    await clearDemoDataForUser({ workspaceId: ctx.workspaceId, userId: ctx.userId });
  } catch (err) {
    Sentry.captureException(err);
    const sep = redirectTo.includes("?") ? "&" : "?";
    redirect(`${redirectTo}${sep}demo=failed`);
  }

  revalidatePath("/inbox");
  revalidatePath("/weekly");
  revalidatePath("/settings");

  const sep = redirectTo.includes("?") ? "&" : "?";
  redirect(`${redirectTo}${sep}demo=cleared`);
}


