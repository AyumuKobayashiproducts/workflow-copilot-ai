import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const AUTH_BYPASS_ENABLED = process.env.AUTH_BYPASS === "1";
const TEST_USER_ID = "test-user";
const TEST_USER_EMAIL = "test-user@example.com";

async function ensureTestUser() {
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: {
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      name: "Test User"
    }
  });
}

export async function getUserIdOrNull(): Promise<string | null> {
  if (AUTH_BYPASS_ENABLED) {
    await ensureTestUser();
    return TEST_USER_ID;
  }

  const session = await auth();
  return session?.user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const userId = await getUserIdOrNull();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}


