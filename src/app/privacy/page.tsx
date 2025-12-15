import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function PrivacyPage() {
  const locale = await getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("legal.privacy.title")}</h1>
        <p className="text-sm text-neutral-700">{t("legal.updatedAt")}</p>
      </header>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 text-sm text-neutral-800 shadow-sm">
        <p>{t("legal.privacy.intro")}</p>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-900">{t("legal.privacy.dataWeCollect.title")}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("legal.privacy.dataWeCollect.item1")}</li>
            <li>{t("legal.privacy.dataWeCollect.item2")}</li>
            <li>{t("legal.privacy.dataWeCollect.item3")}</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-900">{t("legal.privacy.howWeUse.title")}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t("legal.privacy.howWeUse.item1")}</li>
            <li>{t("legal.privacy.howWeUse.item2")}</li>
            <li>{t("legal.privacy.howWeUse.item3")}</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-900">{t("legal.privacy.security.title")}</h2>
          <p className="text-neutral-700">{t("legal.privacy.security.desc")}</p>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-medium text-neutral-900">{t("legal.privacy.dataDeletion.title")}</h2>
          <p className="text-neutral-700">{t("legal.privacy.dataDeletion.desc")}</p>
        </div>
      </section>
    </div>
  );
}


