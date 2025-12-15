import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { clearMyDemoDataAction } from "@/app/actions/demo";
import {
  createWorkspaceInviteAction,
  revokeWorkspaceInviteAction,
  switchWorkspaceAction,
  updateWorkspaceMemberRoleAction
} from "@/app/actions/workspaces";
import { prisma } from "@/lib/db";
import { getWorkspaceContextOrNull } from "@/lib/workspaces/context";
import { listWorkspaceActivities } from "@/lib/tasks/activity";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function SettingsPage(props: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  const ctx = await getWorkspaceContextOrNull();
  if (!ctx) redirect("/login");

  const enabled = process.env.DEMO_TOOLS === "1";
  const slackWebhook = process.env.SLACK_WEBHOOK_URL ?? "";
  const slackConfigured = Boolean(slackWebhook) && slackWebhook !== "mock";
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);
  const sentryConfigured = Boolean(process.env.SENTRY_DSN);
  const aiDailyLimit = Number(process.env.AI_DAILY_LIMIT ?? "20");

  const searchParams = (await props.searchParams) ?? {};
  const demoRaw = searchParams.demo;
  const demo = (Array.isArray(demoRaw) ? demoRaw[0] : demoRaw) ?? "";
  const inviteRaw = searchParams.invite;
  const inviteStatus = (Array.isArray(inviteRaw) ? inviteRaw[0] : inviteRaw) ?? "";
  const workspaceRaw = searchParams.workspace;
  const workspaceStatus = (Array.isArray(workspaceRaw) ? workspaceRaw[0] : workspaceRaw) ?? "";
  const memberRaw = searchParams.member;
  const memberStatus = (Array.isArray(memberRaw) ? memberRaw[0] : memberRaw) ?? "";

  const myMemberships = await prisma.workspaceMembership.findMany({
    where: { userId: ctx.userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      role: true,
      workspace: { select: { id: true, name: true } }
    }
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

  const invites = await prisma.workspaceInvite.findMany({
    where: { workspaceId: ctx.workspaceId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, token: true, expiresAt: true, usedCount: true, maxUses: true }
  });

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin = process.env.AUTH_URL ?? (host ? `${proto}://${host}` : "http://localhost:3000");

  const recentActivity = await listWorkspaceActivities({ workspaceId: ctx.workspaceId, take: 20 });

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
      ) : demo === "forbidden" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.demoTools.forbidden")}
        </section>
      ) : demo === "failed" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.demoTools.failed")}
        </section>
      ) : null}

      {inviteStatus === "created" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.invite.created")}
        </section>
      ) : inviteStatus === "revoked" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.invite.revoked")}
        </section>
      ) : inviteStatus === "accepted" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.invite.accepted")}
        </section>
      ) : inviteStatus === "forbidden" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.invite.forbidden")}
        </section>
      ) : inviteStatus === "failed" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.invite.failed")}
        </section>
      ) : workspaceStatus === "forbidden" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.switch.forbidden")}
        </section>
      ) : memberStatus === "updated" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.members.updated")}
        </section>
      ) : memberStatus === "last_owner" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.members.lastOwner")}
        </section>
      ) : memberStatus === "self_forbidden" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.members.selfForbidden")}
        </section>
      ) : memberStatus === "forbidden" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.members.forbidden")}
        </section>
      ) : memberStatus === "not_found" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.members.notFound")}
        </section>
      ) : memberStatus === "failed" ? (
        <section className="rounded-lg border border-neutral-300 bg-white p-4 text-sm text-neutral-900 shadow-sm">
          {t("settings.workspace.members.failed")}
        </section>
      ) : null}

      {myMemberships.length > 1 ? (
        <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium">{t("settings.workspace.switch.title")}</h2>
          <ul className="space-y-2 text-sm">
            {myMemberships.map((m) => {
              const active = m.workspace.id === ctx.workspaceId;
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-neutral-900">{m.workspace.name}</div>
                    <div className="text-xs text-neutral-600">
                      {t("settings.workspace.role")}: {m.role}
                      {active ? ` · ${t("settings.workspace.switch.active")}` : ""}
                    </div>
                  </div>
                  {!active ? (
                    <form action={switchWorkspaceAction}>
                      <input type="hidden" name="workspaceId" value={m.workspace.id} />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("settings.workspace.switch.cta")}
                      </Button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{t("settings.workspace.title")}</h2>
          <div className="text-xs text-neutral-700">
            {t("settings.workspace.role")}: {ctx.role}
          </div>
        </div>

        <div className="text-sm text-neutral-700">
          {t("settings.workspace.name")}: <span className="font-medium text-neutral-900">{ctx.workspaceName}</span>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium text-neutral-700">{t("settings.workspace.members")}</div>
          <ul className="space-y-1 text-sm">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-neutral-900">
                  {m.user.name || m.user.email || m.user.id}
                </span>
                {ctx.role === "owner" && m.user.id !== ctx.userId ? (
                  <form action={updateWorkspaceMemberRoleAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={m.user.id} />
                    <select
                      name="role"
                      defaultValue={m.role}
                      className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
                    >
                      <option value="member">{t("settings.workspace.role.member")}</option>
                      <option value="owner">{t("settings.workspace.role.owner")}</option>
                    </select>
                    <Button type="submit" size="sm" variant="secondary">
                      {t("settings.workspace.members.updateCta")}
                    </Button>
                  </form>
                ) : (
                  <span className="text-xs text-neutral-700">
                    {m.role === "owner" ? t("settings.workspace.role.owner") : t("settings.workspace.role.member")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {ctx.role === "owner" ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-700">{t("settings.workspace.invite.title")}</div>
            <form action={createWorkspaceInviteAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="maxUses" value="5" />
              <select
                name="role"
                defaultValue="member"
                className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
              >
                <option value="member">{t("settings.workspace.role.member")}</option>
                <option value="owner">{t("settings.workspace.role.owner")}</option>
              </select>
              <Button type="submit" variant="secondary">
                {t("settings.workspace.invite.create")}
              </Button>
            </form>

            {invites.length > 0 ? (
              <div className="space-y-2">
                {invites.map((inv) => {
                  const url = `${origin}/invite/${inv.token}`;
                  return (
                    <div key={inv.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs text-neutral-700">
                          {t("settings.workspace.invite.usage")}: {inv.usedCount}/{inv.maxUses}
                        </div>
                        <form action={revokeWorkspaceInviteAction}>
                          <input type="hidden" name="id" value={inv.id} />
                          <Button type="submit" size="sm" variant="secondary">
                            {t("settings.workspace.invite.revoke")}
                          </Button>
                        </form>
                      </div>
                      <div className="mt-2 break-all text-sm text-neutral-900">{url}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {inv.expiresAt ? `${t("settings.workspace.invite.expiresAt")}: ${inv.expiresAt.toLocaleString(locale)}` : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-700">{t("settings.workspace.invite.none")}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-neutral-700">{t("settings.workspace.invite.ownerOnly")}</p>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("settings.activity.title")}</h2>
        {recentActivity.length === 0 ? (
          <p className="text-sm text-neutral-700">{t("settings.activity.empty")}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentActivity.map((a) => {
              const actor = a.actor.name || a.actor.email || a.actor.id;
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
                          case "workspace_invite_created":
                            return t("task.activity.kind.workspaceInviteCreated");
                          case "workspace_invite_revoked":
                            return t("task.activity.kind.workspaceInviteRevoked");
                          case "workspace_member_role_updated":
                            return t("task.activity.kind.workspaceMemberRoleUpdated");
                          case "workspace_invite_accepted":
                            return t("task.activity.kind.workspaceInviteAccepted");
                          case "workspace_member_joined":
                            return t("task.activity.kind.workspaceMemberJoined");
                          case "workspace_invite_used":
                            return t("task.activity.kind.workspaceInviteUsed");
                          case "workspace_invite_used_up":
                            return t("task.activity.kind.workspaceInviteUsedUp");
                  default:
                    return kind;
                }
              }
              return (
                <li key={a.id} className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-medium text-neutral-700">{kindLabel(a.kind)}</div>
                    <div className="text-xs text-neutral-500">{a.createdAt.toLocaleString(locale)}</div>
                  </div>
                          <div className="text-sm text-neutral-900">
                            <span className="font-medium">{actor}</span>
                            {a.task ? (
                              <>
                                <span className="text-neutral-700"> · </span>
                                <Link className="text-neutral-900 underline underline-offset-4" href={`/tasks/${a.task.id}`}>
                                  {a.task.title}
                                </Link>
                              </>
                            ) : null}
                            {a.message ? <span className="text-neutral-700"> — {a.message}</span> : null}
                          </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{t("settings.permissions.title")}</h2>
        <p className="text-sm text-neutral-700">{t("settings.permissions.subtitle")}</p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs text-neutral-700">
                <th className="border-b border-neutral-200 pb-2 pr-4">{t("settings.permissions.action")}</th>
                <th className="border-b border-neutral-200 pb-2 pr-4">{t("settings.workspace.role.owner")}</th>
                <th className="border-b border-neutral-200 pb-2">{t("settings.workspace.role.member")}</th>
              </tr>
            </thead>
            <tbody className="text-sm text-neutral-900">
              <tr>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("settings.permissions.rows.assign")}</td>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("common.yes")}</td>
                <td className="border-b border-neutral-100 py-2">{t("common.no")}</td>
              </tr>
              <tr>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("settings.permissions.rows.toggleDone")}</td>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("common.yes")}</td>
                <td className="border-b border-neutral-100 py-2">{t("settings.permissions.member.toggleDone")}</td>
              </tr>
              <tr>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("settings.permissions.rows.editTitle")}</td>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("common.yes")}</td>
                <td className="border-b border-neutral-100 py-2">{t("settings.permissions.member.editTitle")}</td>
              </tr>
              <tr>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("settings.permissions.rows.delete")}</td>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("common.yes")}</td>
                <td className="border-b border-neutral-100 py-2">{t("settings.permissions.member.delete")}</td>
              </tr>
              <tr>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("settings.permissions.rows.invites")}</td>
                <td className="border-b border-neutral-100 py-2 pr-4">{t("common.yes")}</td>
                <td className="border-b border-neutral-100 py-2">{t("common.no")}</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">{t("settings.permissions.rows.memberRoles")}</td>
                <td className="py-2 pr-4">{t("common.yes")}</td>
                <td className="py-2">{t("common.no")}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

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
            <input type="hidden" name="redirectTo" value="/settings" />
            <Button type="submit" variant="secondary">
              {t("settings.demoTools.clearCta")}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}


