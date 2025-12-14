"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { defaultLocale, localeCookieName, type Locale } from "@/lib/i18n/config";

export async function setLocale(nextLocale: Locale, backUrl: string = "/") {
  const locale: Locale = nextLocale === "ja" ? "ja" : "en";
  cookies().set(localeCookieName, locale, { path: "/" });
  redirect(backUrl || "/");
}

export async function resetLocale(backUrl: string = "/") {
  cookies().set(localeCookieName, defaultLocale, { path: "/" });
  redirect(backUrl || "/");
}


