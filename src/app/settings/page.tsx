import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { Button } from "@/components/ui/button";
import { clearMyDemoDataAction } from "@/app/actions/demo";
import { createWorkspaceInviteAction, revokeWorkspaceInviteAction } from "@/app/actions/workspaces";
import { prisma } from "@/lib/db";
import { getWorkspaceContextOrNull } from "@/lib/workspaces/context";
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
                <span className="text-xs text-neutral-700">{m.role}</span>
              </li>
            ))}
          </ul>
        </div>

        {ctx.role === "owner" ? (
          <div className="space-y-2">
            <div className="text-xs font-medium text-neutral-700">{t("settings.workspace.invite.title")}</div>
            <form action={createWorkspaceInviteAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="maxUses" value="5" />
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


