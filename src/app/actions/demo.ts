"use server";

import * as Sentry from "@sentry/nextjs";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/user";

function ensureDemoToolsEnabled() {
  if (process.env.DEMO_TOOLS !== "1") {
    throw new Error("Demo tools are disabled");
  }
}

async function seedDemoDataForUser(userId: string) {
  await prisma.aiUsage.deleteMany({ where: { userId } });
  await prisma.task.deleteMany({ where: { userId } });
  await prisma.weeklyNote.deleteMany({ where: { userId } });
  await prisma.weeklyReport.deleteMany({ where: { userId } });

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
        userId,
        title: "Write down today's top goal (10 min)",
        status: "done",
        source: "demo",
        createdAt: withinWeek(0),
        updatedAt: withinWeek(0),
        completedAt: withinWeek(0)
      },
      {
        userId,
        title: "Break it into 5 steps",
        status: "done",
        source: "demo",
        createdAt: withinWeek(1),
        updatedAt: withinWeek(1),
        completedAt: withinWeek(1)
      },
      {
        userId,
        title: "Do the smallest next step (10 min)",
        status: "todo",
        source: "demo",
        createdAt: withinWeek(2),
        updatedAt: withinWeek(2),
        focusAt: withinWeek(2)
      },
      {
        userId,
        title: "Share a weekly report to Slack",
        status: "todo",
        source: "demo",
        createdAt: withinWeek(3),
        updatedAt: withinWeek(3)
      }
    ]
  });

  await prisma.weeklyNote.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    update: { note: "Demo week: shipped core workflow + added monitoring." },
    create: { userId, weekStart, note: "Demo week: shipped core workflow + added monitoring." }
  });

  await prisma.weeklyReport.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    update: {
      text: [
        `Weekly report (${weekStart.toLocaleDateString("en-US")} - ${weekEnd.toLocaleDateString("en-US")})`,
        "- Highlights: Implemented end-to-end workflow (Inbox → Breakdown → Weekly → Slack)",
        "- Challenges: Making AI outputs stable and user-safe",
        "- Next week: Polish UX + ship a public demo"
      ].join("\n")
    },
    create: {
      userId,
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

function safeRedirectTo(raw: string | null): string {
  const v = (raw ?? "").trim();
  if (!v.startsWith("/")) return "/settings?demo=seeded";
  return v;
}

export async function seedMyDemoDataAction(formData: FormData) {
  ensureDemoToolsEnabled();
  const userId = await requireUserId();
  const redirectTo = safeRedirectTo(String(formData.get("redirectTo") ?? ""));

  try {
    await seedDemoDataForUser(userId);
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

export async function clearMyDemoDataAction() {
  ensureDemoToolsEnabled();
  const userId = await requireUserId();

  await seedDemoDataForUser(userId);

  revalidatePath("/inbox");
  revalidatePath("/weekly");
  revalidatePath("/settings");

  redirect("/settings?demo=seeded");
}


