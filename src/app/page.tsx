import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auth } from "@/auth";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function HomePage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const session = await auth();
  const signedIn = Boolean(session?.user) || process.env.AUTH_BYPASS === "1";
  const demoEnabled = process.env.DEMO_TOOLS === "1";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("home.title")}</h1>
        <p className="text-sm text-neutral-700">{t("home.subtitle")}</p>
      </header>

      <section className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          <h2 className="text-sm font-medium">{t("home.demo.title")}</h2>
          <ol className="space-y-2 text-sm text-neutral-800">
            <li>
              <span className="font-medium">{t("home.demo.step1.title")}</span>
              <div className="text-neutral-700">{t(demoEnabled ? "home.demo.step1.enabled" : "home.demo.step1.disabled")}</div>
            </li>
            <li>
              <span className="font-medium">{t("home.demo.step2.title")}</span>
              <div className="text-neutral-700">{t("home.demo.step2.desc")}</div>
            </li>
            <li>
              <span className="font-medium">{t("home.demo.step3.title")}</span>
              <div className="text-neutral-700">{t("home.demo.step3.desc")}</div>
            </li>
          </ol>

          <div className="flex flex-wrap gap-2 pt-2">
            {signedIn ? (
              <>
                <Button asChild>
                  <Link href="/breakdown">{t("home.cta.start")}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/inbox">{t("nav.inbox")}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/weekly">{t("nav.weekly")}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/settings">{t("nav.settings")}</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/login">{t("home.cta.signIn")}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/login?callbackUrl=%2Fbreakdown">{t("home.cta.signInAndStart")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("home.whatYouCanDo.title")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
          <li>{t("home.whatYouCanDo.item1")}</li>
          <li>{t("home.whatYouCanDo.item2")}</li>
          <li>{t("home.whatYouCanDo.item3")}</li>
        </ul>
      </section>
    </div>
  );
}


