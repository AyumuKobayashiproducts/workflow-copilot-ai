import type { ReactNode } from "react";
import Link from "next/link";

import "./globals.css";

import { LanguageSwitcher } from "@/components/language-switcher";
import { TopNav } from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/auth";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);
  const session = await auth();

  return (
    <html lang={locale}>
      <body>
        <div className="min-h-dvh">
          <header className="sticky top-0 z-40 border-b border-neutral-200 bg-neutral-50/80 backdrop-blur">
            <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <Link href="/" className="text-sm font-semibold no-underline">
                  {t("common.appName")}
                </Link>
                <TopNav
                  menuLabel={t("nav.menu")}
                  items={[
                    { href: "/", label: t("nav.home") },
                    { href: "/inbox", label: t("nav.inbox") },
                    { href: "/breakdown", label: t("nav.breakdown") },
                    { href: "/weekly", label: t("nav.weekly") },
                    { href: "/settings", label: t("nav.settings") },
                    { href: "/login", label: t("nav.login") }
                  ]}
                />
              </div>
              <div className="flex items-center gap-2">
                <LanguageSwitcher
                  label={t("languageSwitcher.label")}
                  english={t("languageSwitcher.english")}
                  japanese={t("languageSwitcher.japanese")}
                />

                {session?.user ? (
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/login" });
                    }}
                  >
                    <Button type="submit" variant="secondary" size="sm">
                      {t("auth.signOut")}
                    </Button>
                  </form>
                ) : (
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/login">{t("auth.signIn")}</Link>
                  </Button>
                )}
              </div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-6">{children}</main>
          <footer className="border-t border-neutral-200 bg-neutral-50">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 px-4 py-6 text-sm text-neutral-700 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Link href="/terms" className="underline-offset-2 hover:underline">
                  {t("footer.terms")}
                </Link>
                <Link href="/privacy" className="underline-offset-2 hover:underline">
                  {t("footer.privacy")}
                </Link>
              </div>
              <div className="text-xs text-neutral-500">{t("footer.disclaimer")}</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}


