import Link from "next/link";

import { Button } from "@/components/ui/button";
import { createTasksFromBreakdownAction } from "@/app/actions/tasks";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

function interpolate(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k]! : `{${k}}`));
}

export default async function BreakdownPage(props: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const locale = getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const searchParams = (await props.searchParams) ?? {};
  const goalRaw = searchParams.goal;
  const goal = (Array.isArray(goalRaw) ? goalRaw[0] : goalRaw) ?? "";
  const goalTrimmed = goal.trim();

  const generatedSteps = goalTrimmed
    ? [
        interpolate(t("breakdown.generated.step1"), { goal: goalTrimmed }),
        t("breakdown.generated.step2"),
        t("breakdown.generated.step3"),
        t("breakdown.generated.step4"),
        t("breakdown.generated.step5")
      ]
    : [];

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

      <section className="space-y-4 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <form method="GET" className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="goal">
              {t("breakdown.input.label")}
            </label>
            <input
              id="goal"
              name="goal"
              defaultValue={goalTrimmed}
              placeholder={t("breakdown.input.placeholder")}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit">{t("breakdown.cta.generate")}</Button>
            <Button asChild type="button" variant="secondary">
              <Link href="/breakdown">{t("breakdown.steps.clear")}</Link>
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{t("breakdown.steps.title")}</h2>
          <form action={createTasksFromBreakdownAction}>
            <input type="hidden" name="steps" value={generatedSteps.join("\n")} />
            <Button type="submit" variant="secondary" disabled={generatedSteps.length === 0}>
              {t("breakdown.steps.saveToInbox")}
            </Button>
          </form>
        </div>

        {generatedSteps.length === 0 ? (
          <p className="text-sm text-neutral-700">{t("empty.description")}</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {generatedSteps.map((s, i) => (
              <li key={`${i}-${s}`} className="text-neutral-900">
                {s}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}


