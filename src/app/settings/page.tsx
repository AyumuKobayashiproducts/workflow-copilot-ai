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
      ) : null}

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


