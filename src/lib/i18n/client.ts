"use client";

import { useMemo } from "react";

import { defaultLocale, localeCookieName, type Locale, type Messages } from "./config";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const parts = document.cookie.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return undefined;
  return decodeURIComponent(found.slice(name.length + 1));
}

export function useLocale(initialLocale?: Locale): Locale {
  return useMemo(() => {
    if (initialLocale) return initialLocale;
    const raw = readCookie(localeCookieName);
    if (raw === "en" || raw === "ja") return raw;
    return defaultLocale;
  }, [initialLocale]);
}

export function useT(messages: Messages) {
  return useMemo(() => {
    return (key: string) => {
      const value = messages[key];
      if (typeof value !== "string") {
        throw new Error(`Missing i18n key: ${key}`);
      }
      return value;
    };
  }, [messages]);
}


