import Link from "next/link";

import { Button } from "@/components/ui/button";
import { auth, signIn } from "@/auth";
import { createT, getLocale, getMessages } from "@/lib/i18n/server";

export default async function LoginPage(props: { searchParams?: Promise<Record<string, string | string[]>> }) {
  const locale = getLocale();
  const messages = await getMessages(locale);
  const t = createT(messages);
  const session = await auth();

  const searchParams = (await props.searchParams) ?? {};
  const callbackRaw = searchParams.callbackUrl;
  const callbackUrl = (Array.isArray(callbackRaw) ? callbackRaw[0] : callbackRaw) ?? "/inbox";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">{t("login.title")}</h1>
        <p className="text-sm text-neutral-700">{t("login.subtitle")}</p>
      </header>

      <section className="space-y-4 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        {session?.user ? (
          <Button asChild className="w-full">
            <Link href={callbackUrl}>{t("login.cta.continueToApp")}</Link>
          </Button>
        ) : (
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: callbackUrl });
            }}
          >
            <Button type="submit" className="w-full">
              {t("login.cta.signInWithGithub")}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}


