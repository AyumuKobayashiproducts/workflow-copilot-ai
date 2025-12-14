"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function TopNav(props: {
  items: Array<{ href: string; label: string }>;
  menuLabel: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (!pathname) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <nav className="no-scrollbar hidden items-center gap-2 sm:flex sm:max-w-[55vw] sm:flex-nowrap sm:overflow-x-auto sm:whitespace-nowrap">
        {props.items.map((item) => {
          const active = isActive(item.href);
          return (
            <Button
              key={item.href}
              asChild
              size="sm"
              variant={active ? "default" : "secondary"}
              className={cn(active && "shadow-sm")}
              aria-current={active ? "page" : undefined}
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          );
        })}
      </nav>

      <div className="sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="sm" aria-label={props.menuLabel}>
              {props.menuLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {props.items.map((item) => {
              const active = isActive(item.href);
              return (
                <DropdownMenuItem
                  key={item.href}
                  onSelect={() => router.push(item.href)}
                  className={cn(active && "font-medium")}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}


