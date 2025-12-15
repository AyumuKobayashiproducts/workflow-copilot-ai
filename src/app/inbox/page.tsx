import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TaskTitleInlineEdit } from "@/components/task-title-inline-edit";
import { ToastUrlCleaner } from "@/components/toast-url-cleaner";
import { seedMyDemoDataAction } from "@/app/actions/demo";
import {
  assignTaskAction,
  clearFocusTaskAction,
  createTaskAction,
  deleteTaskAction,
  toggleTaskDoneAction,
} from "@/app/actions/tasks";
import { prisma } from "@/lib/db";
import { getWorkspaceContextOrNull } from "@/lib/workspaces/context";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { countTasks, getFocusTask, listInboxTasks } from "@/lib/tasks/store";

export default async function InboxPage(props: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);
  const ctx = await getWorkspaceContextOrNull();
  if (!ctx) redirect("/login");

  const demoEnabled = process.env.DEMO_TOOLS === "1";
  const searchParams = (await props.searchParams) ?? {};
  const qRaw = searchParams.q;
  const q = ((Array.isArray(qRaw) ? qRaw[0] : qRaw) ?? "").trim();
  const statusRaw = searchParams.status;
  const status = (Array.isArray(statusRaw) ? statusRaw[0] : statusRaw) ?? "all";
  const statusFilter = status === "todo" || status === "done" ? status : "all";
  const sortRaw = searchParams.sort;
  const sort = (Array.isArray(sortRaw) ? sortRaw[0] : sortRaw) ?? "todoFirst";
  const sortKey = sort === "createdDesc" || sort === "completedDesc" || sort === "todoFirst" ? sort : "todoFirst";
  const scopeRaw = searchParams.scope;
  const scope = (Array.isArray(scopeRaw) ? scopeRaw[0] : scopeRaw) === "all" ? "all" : "mine";
  const toastRaw = searchParams.toast;
  const toast = (Array.isArray(toastRaw) ? toastRaw[0] : toastRaw) ?? "";
  const toastMessage =
    toast === "task_updated"
      ? t("toast.taskUpdated")
      : toast === "task_update_failed"
        ? t("toast.taskUpdateFailed")
        : toast === "focus_set"
          ? t("toast.focusSet")
          : toast === "focus_cleared"
            ? t("toast.focusCleared")
            : toast === "focus_failed"
              ? t("toast.focusFailed")
              : "";

  const totalCount = await countTasks({ workspaceId: ctx.workspaceId, userId: ctx.userId, assigneeScope: scope });

  const members = await prisma.workspaceMembership.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, email: true } }
    }
  });

  const [visibleTasks, focusTask] = await Promise.all([
    listInboxTasks(
      { workspaceId: ctx.workspaceId, userId: ctx.userId },
      { q, status: statusFilter, sort: sortKey, scope }
    ),
    getFocusTask({ workspaceId: ctx.workspaceId, userId: ctx.userId })
  ]);

  const selfUrl = inboxUrl({ q: q || undefined, status: statusFilter, sort: sortKey, scope });

  function inboxUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return qs ? `/inbox?${qs}` : "/inbox";
  }

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
          <h1 className="text-2xl font-semibold">{t("inbox.title")}</h1>
          <p className="text-sm text-neutral-700">{t("inbox.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/breakdown">{t("nav.breakdown")}</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/weekly">{t("nav.weekly")}</Link>
          </Button>
        </div>
      </header>

      {toastMessage ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {toastMessage}
          <ToastUrlCleaner />
        </section>
      ) : null}

      <section className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full space-y-2 sm:max-w-md">
            <div className="text-sm font-medium">{t("common.search")}</div>
            <form action="/inbox" method="get" className="flex gap-2">
              <input
                name="q"
                defaultValue={q}
                placeholder={t("inbox.search.placeholder")}
                data-testid="inbox-search-input"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <input type="hidden" name="status" value={statusFilter} />
              <input type="hidden" name="sort" value={sortKey} />
              <input type="hidden" name="scope" value={scope} />
              <Button type="submit" variant="secondary" className="shrink-0" data-testid="inbox-search-submit">
                {t("common.search")}
              </Button>
            </form>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium text-neutral-900">{t("common.filter")}</div>
            <Button asChild size="sm" variant={statusFilter === "all" ? "default" : "secondary"}>
              <Link
                href={inboxUrl({ q: q || undefined, status: "all", sort: sortKey, scope })}
                data-testid="inbox-filter-all"
              >
                {t("inbox.filter.all")}
              </Link>
            </Button>
            <Button asChild size="sm" variant={statusFilter === "todo" ? "default" : "secondary"}>
              <Link
                href={inboxUrl({ q: q || undefined, status: "todo", sort: sortKey, scope })}
                data-testid="inbox-filter-todo"
              >
                {t("inbox.filter.todo")}
              </Link>
            </Button>
            <Button asChild size="sm" variant={statusFilter === "done" ? "default" : "secondary"}>
              <Link
                href={inboxUrl({ q: q || undefined, status: "done", sort: sortKey, scope })}
                data-testid="inbox-filter-done"
              >
                {t("inbox.filter.done")}
              </Link>
            </Button>

            <div className="mx-1 h-5 w-px bg-neutral-200" aria-hidden="true" />

            <div className="text-sm font-medium text-neutral-900">{t("inbox.scope.label")}</div>
            <Button asChild size="sm" variant={scope === "mine" ? "default" : "secondary"}>
              <Link href={inboxUrl({ q: q || undefined, status: statusFilter, sort: sortKey, scope: "mine" })}>
                {t("inbox.scope.mine")}
              </Link>
            </Button>
            <Button asChild size="sm" variant={scope === "all" ? "default" : "secondary"}>
              <Link href={inboxUrl({ q: q || undefined, status: statusFilter, sort: sortKey, scope: "all" })}>
                {t("inbox.scope.all")}
              </Link>
            </Button>

            <div className="mx-1 h-5 w-px bg-neutral-200" aria-hidden="true" />

            <div className="text-sm font-medium text-neutral-900">{t("inbox.sort.label")}</div>
            <Button asChild size="sm" variant={sortKey === "todoFirst" ? "default" : "secondary"}>
              <Link
                href={inboxUrl({ q: q || undefined, status: statusFilter, sort: "todoFirst", scope })}
                data-testid="inbox-sort-todo-first"
              >
                {t("inbox.sort.todoFirst")}
              </Link>
            </Button>
            <Button asChild size="sm" variant={sortKey === "createdDesc" ? "default" : "secondary"}>
              <Link
                href={inboxUrl({ q: q || undefined, status: statusFilter, sort: "createdDesc", scope })}
                data-testid="inbox-sort-created-desc"
              >
                {t("inbox.sort.createdDesc")}
              </Link>
            </Button>
            <Button asChild size="sm" variant={sortKey === "completedDesc" ? "default" : "secondary"}>
              <Link
                href={inboxUrl({ q: q || undefined, status: statusFilter, sort: "completedDesc", scope })}
                data-testid="inbox-sort-completed-desc"
              >
                {t("inbox.sort.completedDesc")}
              </Link>
            </Button>

            {(q || statusFilter !== "all" || scope !== "mine") && (
              <Button asChild size="sm" variant="secondary">
                <Link href="/inbox" data-testid="inbox-filter-clear">
                  {t("common.clear")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h2 className="text-sm font-medium">{t("inbox.newTask.label")}</h2>
          <form action={createTaskAction} className="flex gap-2">
            <input
              name="title"
              placeholder={t("inbox.newTask.placeholder")}
              data-testid="new-task-input"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
            <Button type="submit" className="shrink-0" data-testid="new-task-submit">
              {t("inbox.newTask.submit")}
            </Button>
          </form>
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

      <section className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("inbox.tasks.title")}</h2>

        {totalCount === 0 ? (
          <div className="mt-2 space-y-3">
            <p className="text-sm text-neutral-700">{t("inbox.tasks.empty")}</p>
            <p className="text-sm text-neutral-700">{t("inbox.empty.help")}</p>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/breakdown">{t("inbox.empty.ctaBreakdown")}</Link>
              </Button>
              {demoEnabled ? (
                <form action={seedMyDemoDataAction}>
                  <input type="hidden" name="redirectTo" value="/inbox" />
                  <Button type="submit" variant="secondary" size="sm">
                    {t("home.cta.seedDemo")}
                  </Button>
                </form>
              ) : null}
            </div>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-neutral-700">{t("inbox.tasks.noResults")}</p>
          </div>
        ) : (
          <ul className="mt-3 space-y-2">
            {visibleTasks.map((task) => {
              const done = task.status === "done";
              const statusLabel = done ? t("inbox.filter.done") : t("inbox.filter.todo");
              const focused = task.status === "todo" && Boolean(task.focusAt);
              return (
                <li
                  key={task.id}
                  data-testid="task-item"
                  className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
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
                        done={done}
                        editLabel={t("common.edit")}
                        saveLabel={t("common.save")}
                        cancelLabel={t("common.cancel")}
                        redirectTo={selfUrl}
                      />
                      {focused ? (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-900">
                          {t("task.focus.badge")}
                        </span>
                      ) : null}
                      <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                        {statusLabel}
                      </span>
                      <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                        {sourceLabel(task.source)}
                      </span>
                      <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5 text-[10px] text-neutral-700">
                        {t("inbox.assignee.label")}: {memberLabel(task.assignedToUserId)}
                      </span>
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {task.createdAt.toLocaleString(locale)}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {scope === "all" ? (
                      <form action={assignTaskAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={task.id} />
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
                          {t("inbox.assignee.set")}
                        </Button>
                      </form>
                    ) : null}
                    <form action={toggleTaskDoneAction}>
                      <input type="hidden" name="id" value={task.id} />
                      <Button type="submit" size="sm" variant={done ? "secondary" : "default"}>
                        {done ? t("inbox.task.markTodo") : t("inbox.task.markDone")}
                      </Button>
                    </form>
                    <form action={deleteTaskAction}>
                      <input type="hidden" name="id" value={task.id} />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("inbox.task.delete")}
                      </Button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}


