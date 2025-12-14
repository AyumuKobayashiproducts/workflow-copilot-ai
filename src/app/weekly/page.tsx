import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { saveWeeklyNoteAction } from "@/app/actions/weekly";
import { auth } from "@/auth";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { listTasks } from "@/lib/tasks/store";
import { getWeeklyNote } from "@/lib/weekly/store";

export default async function WeeklyPage() {
  const locale = getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const tasks = await listTasks(userId);

  const today = new Date();
  const day = today.getDay(); // 0 Sun ... 6 Sat
  const diffToMonday = (day + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - diffToMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartIso = weekStart.toISOString();
  const note = await getWeeklyNote({ userId, weekStartIso });

  const inWeek = tasks.filter((task) => {
    const created = task.createdAt.getTime();
    return created >= weekStart.getTime() && created <= weekEnd.getTime();
  });

  const doneCount = inWeek.filter((t) => t.status === "done").length;
  const todoCount = inWeek.filter((t) => t.status === "todo").length;
  const blockedCount = 0;

  const startLabel = weekStart.toLocaleDateString(locale);
  const endLabel = weekEnd.toLocaleDateString(locale);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("weekly.title")}</h1>
          <p className="text-sm text-neutral-700">{t("weekly.subtitle")}</p>
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href="/inbox">{t("nav.inbox")}</Link>
        </Button>
      </header>

      <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-700 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-medium">{t("weekly.range.label")}</div>
          <div>
            {startLabel} - {endLabel}
          </div>
        </div>
        <div className="mt-1 text-xs text-neutral-500">
          {t("weekly.meta.weekStart")}: {startLabel}
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm sm:grid-cols-3">
        <div className="space-y-1">
          <div className="text-xs text-neutral-700">{t("weekly.metrics.completed")}</div>
          <div className="text-2xl font-semibold">{doneCount}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-neutral-700">{t("weekly.metrics.inProgress")}</div>
          <div className="text-2xl font-semibold">{todoCount}</div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-neutral-700">{t("weekly.metrics.blocked")}</div>
          <div className="text-2xl font-semibold">{blockedCount}</div>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("weekly.notes.title")}</h2>
        <form action={saveWeeklyNoteAction} className="space-y-3">
          <input type="hidden" name="weekStart" value={weekStartIso} />
          <textarea
            name="note"
            defaultValue={note}
            placeholder={t("weekly.notes.placeholder")}
            className="min-h-28 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <Button type="submit">{t("weekly.cta.saveNotes")}</Button>
          </div>
        </form>
      </section>
    </div>
  );
}


