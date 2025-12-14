import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { clearMyDemoDataAction } from "@/app/actions/demo";
import { getUserIdOrNull } from "@/lib/auth/user";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function SettingsPage(props: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const userId = await getUserIdOrNull();
  if (!userId) redirect("/login");

  const enabled = process.env.DEMO_TOOLS === "1";
  const slackWebhook = process.env.SLACK_WEBHOOK_URL ?? "";
  const slackConfigured = Boolean(slackWebhook) && slackWebhook !== "mock";
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const sentryConfigured = Boolean(process.env.SENTRY_DSN);
  const aiDailyLimit = Number(process.env.AI_DAILY_LIMIT ?? "20");

  const searchParams = (await props.searchParams) ?? {};
  const demoRaw = searchParams.demo;
  const demo = (Array.isArray(demoRaw) ? demoRaw[0] : demoRaw) ?? "";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>
        <p className="text-sm text-neutral-700">{t("settings.subtitle")}</p>
      </header>

      {demo === "cleared" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.demoTools.cleared")}
        </section>
      ) : demo === "seeded" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.demoTools.seeded")}
        </section>
      ) : null}

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("settings.integrations.title")}</h2>

        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between gap-3">
            <span className="text-neutral-900">{t("settings.integrations.slack")}</span>
            <span className="text-neutral-700">
              {slackConfigured ? t("settings.integrations.statusOn") : t("settings.integrations.statusOff")}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-neutral-900">{t("settings.integrations.openai")}</span>
            <span className="text-neutral-700">
              {openAiConfigured ? t("settings.integrations.statusOn") : t("settings.integrations.statusOff")}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-neutral-900">{t("settings.integrations.sentry")}</span>
            <span className="text-neutral-700">
              {sentryConfigured ? t("settings.integrations.statusOn") : t("settings.integrations.statusOff")}
            </span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span className="text-neutral-900">{t("settings.integrations.aiDailyLimit")}</span>
            <span className="text-neutral-700">{aiDailyLimit}</span>
          </li>
        </ul>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("settings.demoTools.title")}</h2>

        {!enabled ? (
          <p className="text-sm text-neutral-700">{t("settings.demoTools.disabled")}</p>
        ) : (
          <form action={clearMyDemoDataAction} className="flex justify-end">
            <Button type="submit" variant="secondary">
              {t("settings.demoTools.clearCta")}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}


