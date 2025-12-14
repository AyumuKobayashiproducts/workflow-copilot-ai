"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/auth/user";

function ensureDemoToolsEnabled() {
  if (process.env.DEMO_TOOLS !== "1") {
    throw new Error("Demo tools are disabled");
  }
}

export async function clearMyDemoDataAction() {
  ensureDemoToolsEnabled();
  const userId = await requireUserId();

  await prisma.task.deleteMany({ where: { userId } });
  await prisma.weeklyNote.deleteMany({ where: { userId } });

  redirect("/settings?demo=cleared");
}


