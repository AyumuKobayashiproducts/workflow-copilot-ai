import Link from "next/link";

import { Button } from "@/components/ui/button";
import { BreakdownGenerator } from "@/components/breakdown-generator";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function BreakdownPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("breakdown.title")}</h1>
          <p className="text-sm text-neutral-700">{t("breakdown.subtitle")}</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/inbox">{t("nav.inbox")}</Link>
        </Button>
      </header>

      <BreakdownGenerator
        goalLabel={t("breakdown.input.label")}
        goalPlaceholder={t("breakdown.input.placeholder")}
        generateLabel={t("breakdown.cta.generate")}
        generatingLabel={t("breakdown.cta.generating")}
        clearLabel={t("breakdown.steps.clear")}
        stepsTitle={t("breakdown.steps.title")}
        emptyDescription={t("empty.description")}
        saveToInboxLabel={t("breakdown.steps.saveToInbox")}
        errorEmptyGoal={t("breakdown.error.emptyGoal")}
        errorNotConfigured={t("breakdown.ai.notConfigured")}
        errorFailed={t("breakdown.ai.failed")}
      />
    </div>
  );
}


