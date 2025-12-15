import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { assignTaskAction } from "@/app/actions/tasks";
import { prisma } from "@/lib/db";
import { getWorkspaceContextOrNull } from "@/lib/workspaces/context";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { listTasks } from "@/lib/tasks/store";
import { getWeeklyNote, getWeeklyReport } from "@/lib/weekly/store";
import {
  clearFocusTaskAction,
  createWeeklyTaskAction,
  setFocusTaskAction,
  toggleTaskDoneAction
} from "@/app/actions/tasks";
import { saveWeeklyNoteAction } from "@/app/actions/weekly";
import { WeeklyShare } from "@/components/weekly-share";
import { WeeklyDoneScopeToggle } from "@/components/weekly-done-scope-toggle";
import { TaskTitleInlineEdit } from "@/components/task-title-inline-edit";
import { ToastUrlCleaner } from "@/components/toast-url-cleaner";

export default async function WeeklyPage(props: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const searchParams = (await props.searchParams) ?? {};
  const weekStartRaw = searchParams.weekStart;
  const weekStartParam = (Array.isArray(weekStartRaw) ? weekStartRaw[0] : weekStartRaw) ?? "";
  const doneScopeRaw = searchParams.doneScope;
  const doneScope = (Array.isArray(doneScopeRaw) ? doneScopeRaw[0] : doneScopeRaw) === "all" ? "all" : "week";
  const scopeRaw = searchParams.scope;
  const scope = (Array.isArray(scopeRaw) ? scopeRaw[0] : scopeRaw) === "all" ? "all" : "mine";

  const ctx = await getWorkspaceContextOrNull();
  if (!ctx) redirect("/login");

  const tasks = await listTasks({
    workspaceId: ctx.workspaceId,
    userId: ctx.userId,
    assigneeScope: scope
  });

  const members = await prisma.workspaceMembership.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, email: true } }
    }
  });

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
  const note = await getWeeklyNote({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso });
  const savedReport = await getWeeklyReport({ workspaceId: ctx.workspaceId, userId: ctx.userId, weekStartIso });

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
  const createdThisWeek = tasks.filter((task) => createdInWeek(task.createdAt));
  const completedThisWeek = tasks.filter((task) => completedInWeek(task.completedAt));
  const focusTask =
    tasks
      .filter((t) => t.status === "todo" && t.focusAt && t.assignedToUserId === ctx.userId)
      .sort((a, b) => (b.focusAt ?? b.createdAt).getTime() - (a.focusAt ?? a.createdAt).getTime())[0] ?? null;

  const selfUrl = `/weekly?weekStart=${encodeURIComponent(weekStartIso)}&doneScope=${encodeURIComponent(doneScope)}&scope=${encodeURIComponent(scope)}`;

  const SHOW_TASKS = 8;

  const doneTasksThisWeek = completedThisWeek
    .filter((t) => t.status === "done")
    .sort((a, b) => {
      const at = (a.completedAt ?? a.createdAt).getTime();
      const bt = (b.completedAt ?? b.createdAt).getTime();
      return bt - at;
    });
  const allDoneTasks = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => {
      const at = (a.completedAt ?? a.createdAt).getTime();
      const bt = (b.completedAt ?? b.createdAt).getTime();
      return bt - at;
    });

  const doneTasks = doneScope === "all" ? allDoneTasks : doneTasksThisWeek;

  const todoTasks = createdThisWeek
    .filter((t) => t.status === "todo")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const doneCount = doneTasksThisWeek.length;
  const todoCount = todoTasks.length;
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
  const toastRaw = searchParams.toast;
  const toast = (Array.isArray(toastRaw) ? toastRaw[0] : toastRaw) ?? "";
  const toastMessage =
    toast === "task_updated"
      ? t("toast.taskUpdated")
      : toast === "task_update_failed"
        ? t("toast.taskUpdateFailed")
        : toast === "forbidden"
          ? t("toast.forbidden")
        : toast === "focus_set"
          ? t("toast.focusSet")
          : toast === "focus_cleared"
            ? t("toast.focusCleared")
            : toast === "focus_failed"
              ? t("toast.focusFailed")
              : "";
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

  const showTasksPanel = createdThisWeek.length > 0 || completedThisWeek.length > 0 || (doneScope === "all" && allDoneTasks.length > 0);

  function sourceLabel(source: string | null | undefined) {
    switch (source) {
      case "inbox":
        return t("task.source.inbox");
      case "breakdown":
        return t("task.source.breakdown");
      case "weekly":
        return t("task.source.weekly");
      case "demo":
        return t("task.source.demo");
      default:
        return t("task.source.unknown");
    }
  }

  function memberLabel(userId: string) {
    const m = members.find((x) => x.user.id === userId);
    return m?.user.name || m?.user.email || userId;
  }

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
              href={`/weekly?weekStart=${encodeURIComponent(prevWeekStart.toISOString())}&doneScope=${encodeURIComponent(
                doneScope
              )}`}
              data-testid="weekly-prev-week"
            >
              {t("weekly.cta.previousWeek")}
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link
              href={`/weekly?weekStart=${encodeURIComponent(nextWeekStart.toISOString())}&doneScope=${encodeURIComponent(
                doneScope
              )}`}
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

      {toastMessage ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {toastMessage}
          <ToastUrlCleaner />
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

      <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-700 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-medium text-neutral-900">{t("weekly.scope.label")}</div>
          <Button asChild size="sm" variant={scope === "mine" ? "default" : "secondary"}>
            <Link href={`/weekly?weekStart=${encodeURIComponent(weekStartIso)}&doneScope=${encodeURIComponent(doneScope)}&scope=mine`}>
              {t("weekly.scope.mine")}
            </Link>
          </Button>
          <Button asChild size="sm" variant={scope === "all" ? "default" : "secondary"}>
            <Link href={`/weekly?weekStart=${encodeURIComponent(weekStartIso)}&doneScope=${encodeURIComponent(doneScope)}&scope=all`}>
              {t("weekly.scope.all")}
            </Link>
          </Button>
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

      {focusTask ? (
        <section className="rounded-lg border border-amber-300 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-medium text-amber-900">{t("weekly.focus.title")}</div>
              <div className="text-sm text-neutral-900">{focusTask.title}</div>
            </div>
            <form action={clearFocusTaskAction}>
              <input type="hidden" name="redirectTo" value={selfUrl} />
              <Button type="submit" size="sm" variant="secondary">
                {t("task.focus.clear")}
              </Button>
            </form>
          </div>
        </section>
      ) : null}

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{t("weekly.tasks.title")}</h2>
          <Button asChild variant="secondary" size="sm">
            <Link href="/inbox">{t("weekly.tasks.goToInbox")}</Link>
          </Button>
        </div>

        <div className="mt-2 space-y-2">
          <div className="text-xs font-medium text-neutral-700">{t("weekly.newTask.label")}</div>
          <form action={createWeeklyTaskAction} className="flex gap-2">
            <input
              name="title"
              placeholder={t("weekly.newTask.placeholder")}
              data-testid="weekly-new-task-input"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <Button type="submit" className="shrink-0" data-testid="weekly-new-task-submit">
              {t("weekly.newTask.submit")}
            </Button>
          </form>
        </div>

        {!showTasksPanel ? (
          <p className="text-sm text-neutral-700">{t("weekly.tasks.empty")}</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-medium text-neutral-700">{t("weekly.section.inProgress")}</div>
              <ul className="space-y-2">
                {todoTasks.slice(0, SHOW_TASKS).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-xs text-neutral-700 underline-offset-4 hover:underline"
                        >
                          {t("task.detail.link")}
                        </Link>
                        <TaskTitleInlineEdit
                          taskId={task.id}
                          title={task.title}
                          done={false}
                          editLabel={t("common.edit")}
                          saveLabel={t("common.save")}
                          cancelLabel={t("common.cancel")}
                          redirectTo={selfUrl}
                        />
                        {task.focusAt ? (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-900">
                            {t("task.focus.badge")}
                          </span>
                        ) : null}
                        <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                          {sourceLabel(task.source)}
                        </span>
                        <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                          {t("weekly.assignee.label")}: {memberLabel(task.assignedToUserId)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">{task.createdAt.toLocaleString(locale)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {scope === "all" && ctx.role === "owner" ? (
                        <form action={assignTaskAction} className="flex items-center gap-2">
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="redirectTo" value={selfUrl} />
                          <select
                            name="assignedToUserId"
                            defaultValue={task.assignedToUserId}
                            className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
                          >
                            {members.map((m) => (
                              <option key={m.user.id} value={m.user.id}>
                                {memberLabel(m.user.id)}
                              </option>
                            ))}
                          </select>
                          <Button type="submit" size="sm" variant="secondary">
                            {t("weekly.assignee.set")}
                          </Button>
                        </form>
                      ) : null}
                      <form action={setFocusTaskAction}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="redirectTo" value={selfUrl} />
                        <Button type="submit" size="sm" variant={task.focusAt ? "default" : "secondary"}>
                          {t("task.focus.set")}
                        </Button>
                      </form>
                      <form action={toggleTaskDoneAction}>
                        <input type="hidden" name="id" value={task.id} />
                        <input type="hidden" name="redirectTo" value={selfUrl} />
                        <Button type="submit" size="sm" variant="secondary">
                          {t("inbox.task.markDone")}
                        </Button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
              {todoTasks.length > SHOW_TASKS ? (
                <details className="group mt-2">
                  <summary className="cursor-pointer select-none text-xs text-neutral-700 underline-offset-4 hover:underline">
                    <span className="group-open:hidden">{t("common.viewAll")}</span>
                    <span className="hidden group-open:inline">{t("common.viewLess")}</span>
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {todoTasks.slice(SHOW_TASKS).map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="text-xs text-neutral-700 underline-offset-4 hover:underline"
                            >
                              {t("task.detail.link")}
                            </Link>
                            <TaskTitleInlineEdit
                              taskId={task.id}
                              title={task.title}
                              done={false}
                              editLabel={t("common.edit")}
                              saveLabel={t("common.save")}
                              cancelLabel={t("common.cancel")}
                              redirectTo={selfUrl}
                            />
                            {task.focusAt ? (
                              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-900">
                                {t("task.focus.badge")}
                              </span>
                            ) : null}
                            <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                              {sourceLabel(task.source)}
                            </span>
                            <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                              {t("weekly.assignee.label")}: {memberLabel(task.assignedToUserId)}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-neutral-500">{task.createdAt.toLocaleString(locale)}</div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {scope === "all" && ctx.role === "owner" ? (
                            <form action={assignTaskAction} className="flex items-center gap-2">
                              <input type="hidden" name="id" value={task.id} />
                              <input type="hidden" name="redirectTo" value={selfUrl} />
                              <select
                                name="assignedToUserId"
                                defaultValue={task.assignedToUserId}
                                className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
                              >
                                {members.map((m) => (
                                  <option key={m.user.id} value={m.user.id}>
                                    {memberLabel(m.user.id)}
                                  </option>
                                ))}
                              </select>
                              <Button type="submit" size="sm" variant="secondary">
                                {t("weekly.assignee.set")}
                              </Button>
                            </form>
                          ) : null}
                          <form action={setFocusTaskAction}>
                            <input type="hidden" name="id" value={task.id} />
                            <input type="hidden" name="redirectTo" value={selfUrl} />
                            <Button type="submit" size="sm" variant={task.focusAt ? "default" : "secondary"}>
                              {t("task.focus.set")}
                            </Button>
                          </form>
                          <form action={toggleTaskDoneAction}>
                            <input type="hidden" name="id" value={task.id} />
                            <input type="hidden" name="redirectTo" value={selfUrl} />
                            <Button type="submit" size="sm" variant="secondary">
                              {t("inbox.task.markDone")}
                            </Button>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-medium text-neutral-700">{t("weekly.section.completed")}</div>
                <WeeklyDoneScopeToggle
                  weekStartIso={weekStartIso}
                  current={doneScope}
                  labelWeekOnly={t("weekly.completedFilter.weekOnly")}
                  labelAll={t("weekly.completedFilter.all")}
                />
              </div>
              <ul className="space-y-2">
                {doneTasks.slice(0, SHOW_TASKS).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <Link
                          href={`/tasks/${task.id}`}
                          className="text-xs text-neutral-700 underline-offset-4 hover:underline"
                        >
                          {t("task.detail.link")}
                        </Link>
                        <TaskTitleInlineEdit
                          taskId={task.id}
                          title={task.title}
                          done
                          editLabel={t("common.edit")}
                          saveLabel={t("common.save")}
                          cancelLabel={t("common.cancel")}
                          redirectTo={selfUrl}
                        />
                        <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                          {sourceLabel(task.source)}
                        </span>
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        {(task.completedAt ?? task.createdAt).toLocaleString(locale)}
                      </div>
                    </div>
                    <form action={toggleTaskDoneAction} className="shrink-0">
                      <input type="hidden" name="id" value={task.id} />
                      <input type="hidden" name="redirectTo" value={selfUrl} />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("inbox.task.markTodo")}
                      </Button>
                    </form>
                  </li>
                ))}
              </ul>
              {doneTasks.length > SHOW_TASKS ? (
                <details className="group mt-2">
                  <summary className="cursor-pointer select-none text-xs text-neutral-700 underline-offset-4 hover:underline">
                    <span className="group-open:hidden">{t("common.viewAll")}</span>
                    <span className="hidden group-open:inline">{t("common.viewLess")}</span>
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {doneTasks.slice(SHOW_TASKS).map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="text-xs text-neutral-700 underline-offset-4 hover:underline"
                            >
                              {t("task.detail.link")}
                            </Link>
                            <TaskTitleInlineEdit
                              taskId={task.id}
                              title={task.title}
                              done
                              editLabel={t("common.edit")}
                              saveLabel={t("common.save")}
                              cancelLabel={t("common.cancel")}
                              redirectTo={selfUrl}
                            />
                            <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                              {sourceLabel(task.source)}
                            </span>
                          </div>
                          <div className="mt-0.5 text-xs text-neutral-500">
                            {(task.completedAt ?? task.createdAt).toLocaleString(locale)}
                          </div>
                        </div>
                        <form action={toggleTaskDoneAction} className="shrink-0">
                          <input type="hidden" name="id" value={task.id} />
                          <input type="hidden" name="redirectTo" value={selfUrl} />
                          <Button type="submit" size="sm" variant="secondary">
                            {t("inbox.task.markTodo")}
                          </Button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
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


