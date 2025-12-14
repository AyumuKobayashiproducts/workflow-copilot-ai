import { notFound, redirect } from "next/navigation";

import { getUserIdOrNull } from "@/lib/auth/user";
import { SentryTestClient } from "@/components/sentry-test-client";

export default async function SentryTestPage() {
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/login");

  // Avoid exposing a test endpoint in production by default.
  const enabled = process.env.SENTRY_TEST_ENABLED === "1";
  if (!enabled) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Sentry test</h1>
        <p className="text-sm text-neutral-700">Send a test error to verify Sentry configuration.</p>
      </header>

      <section className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <SentryTestClient />
      </section>
    </div>
  );
}


