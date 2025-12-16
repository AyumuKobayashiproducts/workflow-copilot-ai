"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import * as Sentry from "@sentry/nextjs";

import en from "@/messages/en.json";
import ja from "@/messages/ja.json";

import { Button } from "@/components/ui/button";
import { localeCookieName, type Locale, type Messages } from "@/lib/i18n/config";
import { useLocale, useT } from "@/lib/i18n/client";

function getMessagesForLocale(locale: Locale): Messages {
  return (locale === "ja" ? (ja as Messages) : (en as Messages)) as Messages;
}

export default function GlobalError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const messages = useMemo(() => getMessagesForLocale(locale), [locale]);
  const t = useT(messages);

  useEffect(() => {
    console.error(props.error);
    Sentry.captureException(props.error);
  }, [props.error]);

  return (
    <html lang={locale}>
      <body>
        <div className="min-h-dvh bg-neutral-50 text-neutral-900 antialiased">
          <main className="mx-auto w-full max-w-3xl px-4 pb-12 pt-10">
            <div className="space-y-6 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
              <header className="space-y-2">
                <h1 className="text-2xl font-semibold">{t("error.title")}</h1>
                <p className="text-sm text-neutral-700">{t("error.description")}</p>
              </header>

              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={props.reset}>
                  {t("common.retry")}
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/inbox">{t("error.cta.goToInbox")}</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/">{t("error.cta.goHome")}</Link>
                </Button>
              </div>
            </div>

            <div className="mt-4 text-xs text-neutral-500">
              {localeCookieName}: {locale}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}


