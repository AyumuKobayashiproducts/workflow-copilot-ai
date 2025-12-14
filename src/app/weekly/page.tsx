import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getUserIdOrNull } from "@/lib/auth/user";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { listTasks } from "@/lib/tasks/store";
import { getWeeklyNote, getWeeklyReport } from "@/lib/weekly/store";
import { toggleTaskDoneAction } from "@/app/actions/tasks";
import { saveWeeklyNoteAction } from "@/app/actions/weekly";
import { WeeklyShare } from "@/components/weekly-share";

export default async function WeeklyPage(props: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const searchParams = (await props.searchParams) ?? {};
  const weekStartRaw = searchParams.weekStart;
  const weekStartParam = (Array.isArray(weekStartRaw) ? weekStartRaw[0] : weekStartRaw) ?? "";

  const userId = await getUserIdOrNull();
  if (!userId) redirect("/login");

  const tasks = await listTasks(userId);

  const base = weekStartParam && !Number.isNaN(new Date(weekStartParam).getTime()) ? new Date(weekStartParam) : new Date();
  const day = base.getDay(); // 0 Sun ... 6 Sat
  const diffToMonday = (day + 6) % 7;
  const weekStart = new Date(base);
  // Normalize to Monday 00:00 local time (consistent with existing storage)
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - diffToMonday);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekStartIso = weekStart.toISOString();
  const note = await getWeeklyNote({ userId, weekStartIso });
  const savedReport = await getWeeklyReport({ userId, weekStartIso });

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);

  const createdInWeek = (d: Date) => d.getTime() >= weekStart.getTime() && d.getTime() <= weekEnd.getTime();
  const completedInWeek = (d: Date | null) =>
    d ? d.getTime() >= weekStart.getTime() && d.getTime() <= weekEnd.getTime() : false;

  // Weekly review should reflect what happened this week:
  // - tasks created this week
  // - tasks completed this week (even if created earlier)
  const inWeek = tasks.filter((task) => createdInWeek(task.createdAt) || completedInWeek(task.completedAt));

  const doneTasks = inWeek
    .filter((t) => t.status === "done")
    .sort((a, b) => {
      const at = (a.completedAt ?? a.createdAt).getTime();
      const bt = (b.completedAt ?? b.createdAt).getTime();
      return bt - at;
    });
  const todoTasks = inWeek
    .filter((t) => t.status === "todo")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const doneCount = inWeek.filter((t) => t.status === "done").length;
  const todoCount = inWeek.filter((t) => t.status === "todo").length;
  const blockedCount = 0;

  const startLabel = weekStart.toLocaleDateString(locale);
  const endLabel = weekEnd.toLocaleDateString(locale);

  const slackRaw = searchParams.slack;
  const slack = (Array.isArray(slackRaw) ? slackRaw[0] : slackRaw) ?? "";
  const slackReasonRaw = searchParams.slackReason;
  const slackReason = (Array.isArray(slackReasonRaw) ? slackReasonRaw[0] : slackReasonRaw) ?? "";
  const noteRaw = searchParams.note;
  const noteStatus = (Array.isArray(noteRaw) ? noteRaw[0] : noteRaw) ?? "";
  const reportRaw = searchParams.report;
  const reportStatus = (Array.isArray(reportRaw) ? reportRaw[0] : reportRaw) ?? "";
  const slackMessageKey =
    slack === "posted"
      ? "weekly.slack.posted"
      : slack === "not_configured"
        ? "weekly.slack.notConfigured"
        : slack === "failed"
          ? slackReason === "rateLimited"
            ? "weekly.slack.failed.rateLimited"
            : slackReason === "invalidPayload"
              ? "weekly.slack.failed.invalidPayload"
              : slackReason === "invalidToken"
                ? "weekly.slack.failed.invalidToken"
                : slackReason === "invalidWebhook"
                  ? "weekly.slack.failed.invalidWebhook"
                  : "weekly.slack.failed"
          : null;
  const showSettingsCta =
    slack === "not_configured" ||
    (slack === "failed" && (slackReason === "invalidToken" || slackReason === "invalidWebhook"));
  const noteMessageKey =
    noteStatus === "saved"
      ? "weekly.notes.saved"
      : noteStatus === "too_long"
        ? "weekly.notes.tooLong"
        : noteStatus === "failed"
          ? "weekly.notes.failed"
          : null;
  const reportMessageKey =
    reportStatus === "saved"
      ? "weekly.report.saved"
      : reportStatus === "too_long"
        ? "weekly.report.tooLong"
        : reportStatus === "failed"
          ? "weekly.report.saveFailed"
          : null;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("weekly.title")}</h1>
          <p className="text-sm text-neutral-700">{t("weekly.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link
              href={`/weekly?weekStart=${encodeURIComponent(prevWeekStart.toISOString())}`}
              data-testid="weekly-prev-week"
            >
              {t("weekly.cta.previousWeek")}
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link
              href={`/weekly?weekStart=${encodeURIComponent(nextWeekStart.toISOString())}`}
              data-testid="weekly-next-week"
            >
              {t("weekly.cta.nextWeek")}
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/inbox">{t("nav.inbox")}</Link>
          </Button>
        </div>
      </header>

      {slackMessageKey ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>{t(slackMessageKey)}</div>
            {showSettingsCta ? (
              <Button asChild variant="secondary" size="sm">
                <Link href="/settings">{t("common.goToSettings")}</Link>
              </Button>
            ) : null}
          </div>
        </section>
      ) : null}

      {noteMessageKey ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t(noteMessageKey)}
        </section>
      ) : null}

      {reportMessageKey ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t(reportMessageKey)}
        </section>
      ) : null}

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
          <div className="text-2xl font-semibold" data-testid="weekly-count-completed">
            {doneCount}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-neutral-700">{t("weekly.metrics.inProgress")}</div>
          <div className="text-2xl font-semibold" data-testid="weekly-count-inprogress">
            {todoCount}
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-neutral-700">{t("weekly.metrics.blocked")}</div>
          <div className="text-2xl font-semibold" data-testid="weekly-count-blocked">
            {blockedCount}
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{t("weekly.tasks.title")}</h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/inbox">{t("weekly.tasks.goToInbox")}</Link>
          </Button>
        </div>

        {inWeek.length === 0 ? (
          <p className="text-sm text-neutral-700">{t("weekly.tasks.empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-medium text-neutral-700">{t("weekly.section.inProgress")}</div>
              <ul className="space-y-2">
                {todoTasks.slice(0, 8).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-neutral-900">{task.title}</div>
                      <div className="mt-0.5 text-xs text-neutral-500">{task.createdAt.toLocaleString(locale)}</div>
                    </div>
                    <form action={toggleTaskDoneAction} className="shrink-0">
                      <input type="hidden" name="id" value={task.id} />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("inbox.task.markDone")}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-neutral-700">{t("weekly.section.completed")}</div>
              <ul className="space-y-2">
                {doneTasks.slice(0, 8).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-neutral-600 line-through">{task.title}</div>
                      <div className="mt-0.5 text-xs text-neutral-500">{task.createdAt.toLocaleString(locale)}</div>
                    </div>
                    <form action={toggleTaskDoneAction} className="shrink-0">
                      <input type="hidden" name="id" value={task.id} />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("inbox.task.markTodo")}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("weekly.notes.title")}</h2>
        <form action={saveWeeklyNoteAction} className="space-y-3">
          <input type="hidden" name="weekStart" value={weekStartIso} />
          <textarea
            name="note"
            defaultValue={note}
            placeholder={t("weekly.notes.placeholder")}
            maxLength={500}
            className="min-h-28 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <div className="flex justify-end">
            <Button type="submit">{t("weekly.cta.saveNotes")}</Button>
          </div>
        </form>
      </section>

      <WeeklyShare
        weekStartIso={weekStartIso}
        note={note}
        initialReport={savedReport}
        reportTitle={t("weekly.report.title")}
        reportTemplateLabel={t("weekly.report.template.label")}
        reportTemplateStandard={t("weekly.report.template.standard")}
        reportTemplateShort={t("weekly.report.template.short")}
        reportTemplateDetailed={t("weekly.report.template.detailed")}
        reportGenerate={t("weekly.report.generate")}
        reportGenerating={t("weekly.report.generating")}
        reportSave={t("weekly.report.save")}
        reportSaving={t("weekly.report.saving")}
        reportCopy={t("weekly.report.copy")}
        reportCopied={t("weekly.report.copied")}
        reportPlaceholder={t("weekly.report.placeholder")}
        reportErrorFailed={t("weekly.report.failed")}
        reportErrorRateLimited={t("weekly.report.rateLimited")}
        slackTitle={t("weekly.slack.title")}
        slackPost={t("weekly.cta.postToSlack")}
        slackPosting={t("weekly.cta.postingToSlack")}
      />
    </div>
  );
}


