import { cookies } from "next/headers";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { defaultLocale, localeCookieName, type Locale, type Messages } from "./config";

export function getLocale(): Locale {
  const raw = cookies().get(localeCookieName)?.value;
  if (raw === "en" || raw === "ja") return raw;
  return defaultLocale;
}

export async function getMessages(locale: Locale): Promise<Messages> {
  const filePath = path.join(process.cwd(), "src", "messages", `${locale}.json`);
  const json = await readFile(filePath, "utf8");
  return JSON.parse(json) as Messages;
}

export function t(messages: Messages, key: string): string {
  const value = messages[key];
  if (typeof value !== "string") {
    throw new Error(`Missing i18n key: ${key}`);
  }
  return value;
}

export function createT(messages: Messages) {
  return (key: string) => t(messages, key);
}


