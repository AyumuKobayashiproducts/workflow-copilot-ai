import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createTaskAction, deleteTaskAction, toggleTaskDoneAction } from "@/app/actions/tasks";
import { getUserIdOrNull } from "@/lib/auth/user";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";
import { listTasks } from "@/lib/tasks/store";

export default async function InboxPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/login");

  const tasks = await listTasks(userId);

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

      <section className="rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("inbox.tasks.title")}</h2>

        {tasks.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-700">{t("inbox.tasks.empty")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {tasks.map((task) => {
              const done = task.status === "done";
              return (
                <li
                  key={task.id}
                  data-testid="task-item"
                  className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className={done ? "truncate text-sm line-through text-neutral-600" : "truncate text-sm"}>
                      {task.title}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">
                      {task.createdAt.toLocaleString(locale)}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
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


