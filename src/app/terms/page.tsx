import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function TermsPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("legal.terms.title")}</h1>
        <p className="text-sm text-neutral-700">{t("legal.updatedAt")}</p>
      </header>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 text-sm text-neutral-800 shadow-sm">
        <p>{t("legal.terms.intro")}</p>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-900">{t("legal.terms.asIs.title")}</h2>
          <p className="text-neutral-700">{t("legal.terms.asIs.desc")}</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-900">{t("legal.terms.accounts.title")}</h2>
          <p className="text-neutral-700">{t("legal.terms.accounts.desc")}</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-900">{t("legal.terms.content.title")}</h2>
          <p className="text-neutral-700">{t("legal.terms.content.desc")}</p>
        </div>
      </section>
    </div>
  );
}


