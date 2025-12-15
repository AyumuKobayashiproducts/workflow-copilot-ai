import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { TaskTitleInlineEdit } from "@/components/task-title-inline-edit";
import { ToastUrlCleaner } from "@/components/toast-url-cleaner";
import { assignTaskAction, deleteTaskAction, toggleTaskDoneAction } from "@/app/actions/tasks";
import { prisma } from "@/lib/db";
import { getWorkspaceContextOrNull } from "@/lib/workspaces/context";
import { listTaskActivities } from "@/lib/tasks/activity";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { addTaskCommentAction } from "@/app/actions/task-activity";

export default async function TaskDetailPage(props: { params: Promise<{ id: string }>; searchParams?: Promise<Record<string, string | string[]>> }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const ctx = await getWorkspaceContextOrNull();
  if (!ctx) redirect("/login");

  const { id } = await props.params;
  const taskId = (id ?? "").trim();
  if (!taskId) redirect("/inbox");

  const task = await prisma.task.findFirst({
    where: { id: taskId, workspaceId: ctx.workspaceId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      assignedToUser: { select: { id: true, name: true, email: true } }
    }
  });
  if (!task) redirect("/inbox");

  const activities = await listTaskActivities({ workspaceId: ctx.workspaceId, taskId, take: 50 });

  const sp = (await props.searchParams) ?? {};
  const commentRaw = sp.comment;
  const comment = (Array.isArray(commentRaw) ? commentRaw[0] : commentRaw) ?? "";
  const toastRaw = sp.toast;
  const toast = (Array.isArray(toastRaw) ? toastRaw[0] : toastRaw) ?? "";
  const commentMessage =
    comment === "empty" ? t("task.activity.commentEmpty") : comment === "failed" ? t("task.activity.commentFailed") : "";
  const toastMessage =
    toast === "task_updated"
      ? t("toast.taskUpdated")
      : toast === "task_update_failed"
        ? t("toast.taskUpdateFailed")
        : toast === "forbidden"
          ? t("toast.forbidden")
          : "";

  const selfUrl = `/tasks/${encodeURIComponent(taskId)}`;

  const members = await prisma.workspaceMembership.findMany({
    where: { workspaceId: ctx.workspaceId },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { user: { select: { id: true, name: true, email: true } } }
  });

  function userLabel(u: { name: string | null; email: string | null; id: string }) {
    return u.name || u.email || u.id;
  }

  function kindLabel(kind: string) {
    switch (kind) {
      case "comment":
        return t("task.activity.kind.comment");
      case "created":
        return t("task.activity.kind.created");
      case "title_updated":
        return t("task.activity.kind.titleUpdated");
      case "status_toggled":
        return t("task.activity.kind.statusToggled");
      case "assigned":
        return t("task.activity.kind.assigned");
      case "focus_set":
        return t("task.activity.kind.focusSet");
      case "focus_cleared":
        return t("task.activity.kind.focusCleared");
      case "deleted":
        return t("task.activity.kind.deleted");
      case "forbidden":
        return t("task.activity.kind.forbidden");
      default:
        return kind;
    }
  }

  function memberLabel(userId: string) {
    const m = members.find((x) => x.user.id === userId);
    return m?.user.name || m?.user.email || userId;
  }

  const canAssign = ctx.role === "owner";
  const canDelete = ctx.role === "owner" || task.userId === ctx.userId;
  const canToggleDone = ctx.role === "owner" || task.assignedToUserId === ctx.userId;
  const canEditTitle = ctx.role === "owner" || task.userId === ctx.userId || task.assignedToUserId === ctx.userId;
  const done = task.status === "done";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{t("task.detail.title")}</h1>
          <p className="text-sm text-neutral-700">{t("task.detail.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/inbox">{t("nav.inbox")}</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href="/weekly">{t("nav.weekly")}</Link>
          </Button>
        </div>
      </header>

      <section className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <div className="text-lg font-medium text-neutral-900">
            {canEditTitle ? (
              <TaskTitleInlineEdit
                taskId={task.id}
                title={task.title}
                done={done}
                editLabel={t("common.edit")}
                saveLabel={t("common.save")}
                cancelLabel={t("common.cancel")}
                redirectTo={selfUrl}
              />
            ) : (
              task.title
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-neutral-700">
            <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5">
              {t("task.detail.status")}: {task.status}
            </span>
            <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5">
              {t("task.detail.assignee")}: {userLabel(task.assignedToUser)}
            </span>
            <span className="rounded-full border border-neutral-300 bg-white px-2 py-0.5">
              {t("task.detail.createdBy")}: {userLabel(task.user)}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          {canAssign ? (
            <form action={assignTaskAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <input type="hidden" name="id" value={taskId} />
              <input type="hidden" name="redirectTo" value={selfUrl} />
              <div className="space-y-1">
                <div className="text-xs font-medium text-neutral-700">{t("task.detail.assign.title")}</div>
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
              </div>
              <Button type="submit" variant="secondary">
                {t("task.detail.assign.cta")}
              </Button>
            </form>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            {canToggleDone ? (
              <form action={toggleTaskDoneAction}>
                <input type="hidden" name="id" value={taskId} />
                <input type="hidden" name="redirectTo" value={selfUrl} />
                <Button type="submit" variant="secondary">
                  {done ? t("inbox.task.markTodo") : t("inbox.task.markDone")}
                </Button>
              </form>
            ) : null}

            {canDelete ? (
              <form action={deleteTaskAction}>
                <input type="hidden" name="id" value={taskId} />
                <input type="hidden" name="redirectTo" value="/inbox" />
                <Button type="submit" variant="secondary">
                  {t("task.detail.delete.cta")}
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      </section>

      {toastMessage ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {toastMessage}
          <ToastUrlCleaner />
        </section>
      ) : null}

      {commentMessage ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {commentMessage}
        </section>
      ) : null}

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("task.activity.title")}</h2>

        <form action={addTaskCommentAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input type="hidden" name="taskId" value={taskId} />
          <div className="w-full space-y-1">
            <div className="text-xs font-medium text-neutral-700">{t("task.activity.addComment")}</div>
            <input
              name="message"
              placeholder={t("task.activity.commentPlaceholder")}
              maxLength={500}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" className="shrink-0">
            {t("task.activity.submit")}
          </Button>
        </form>

        {activities.length === 0 ? (
          <p className="text-sm text-neutral-700">{t("task.activity.empty")}</p>
        ) : (
          <ul className="space-y-2">
            {activities.map((a) => (
              <li key={a.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-medium text-neutral-700">{kindLabel(a.kind)}</div>
                  <div className="text-xs text-neutral-500">{a.createdAt.toLocaleString(locale)}</div>
                </div>
                <div className="mt-1 text-sm text-neutral-900">
                  <span className="font-medium">{a.actor.name || a.actor.email || a.actor.id}</span>
                  {a.message ? <span className="text-neutral-700"> — {a.message}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


