"use client";

import { usePathname } from "next/navigation";

import { setLocale } from "@/app/actions/set-locale";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/config";

export function LanguageSwitcher(props: {
  label: string;
  english: string;
  japanese: string;
}) {
  const pathname = usePathname();

  async function onSelect(nextLocale: Locale) {
    await setLocale(nextLocale, pathname || "/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" aria-label={props.label}>
          {props.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onSelect("en")}>
          {props.english}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onSelect("ja")}>
          {props.japanese}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


