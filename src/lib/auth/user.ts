import { auth } from "@/auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

const AUTH_BYPASS_ENABLED = process.env.AUTH_BYPASS === "1";
const TEST_USER_ID = "test-user";
const TEST_USER_EMAIL = "test-user@example.com";

async function ensureUser(input: { id: string; email: string; name: string }) {
  await prisma.user.upsert({
    where: { id: input.id },
    update: {},
    create: {
      id: input.id,
      email: input.email,
      name: input.name
    }
  });
}

export async function getUserIdOrNull(): Promise<string | null> {
  if (AUTH_BYPASS_ENABLED) {
    // E2E: allow switching the acting user via a cookie.
    // This is only honored when AUTH_BYPASS=1 (never in production).
    const cookieStore = await cookies();
    const override = cookieStore.get("e2e_user_id")?.value?.trim() ?? "";
    const id = override || TEST_USER_ID;
    const email = id === TEST_USER_ID ? TEST_USER_EMAIL : `${id}@example.com`;
    const name = id === TEST_USER_ID ? "Test User" : "Test Member";
    await ensureUser({ id, email, name });
    return id;
  }

  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserIdOrNull();
  if (!userId) throw new UnauthorizedError();
  return userId;
}


