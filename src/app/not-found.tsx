import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function NotFoundPage() {
  const locale = getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{t("error.notFound.title")}</h1>
        <p className="text-sm text-neutral-700">{t("error.notFound.description")}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild>
          <Link href="/inbox">{t("error.cta.goToInbox")}</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">{t("error.cta.goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}


