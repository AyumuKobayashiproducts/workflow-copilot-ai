"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "weekly.doneScope";

type DoneScope = "week" | "all";

function normalizeScope(v: string | null): DoneScope | null {
  if (v === "all") return "all";
  if (v === "week") return "week";
  return null;
}

export function WeeklyDoneScopeToggle(props: {
  weekStartIso: string;
  current: DoneScope;
  labelWeekOnly: string;
  labelAll: string;
}) {
  const sp = useSearchParams();
  const doneScopeParam = normalizeScope(sp.get("doneScope"));

  React.useEffect(() => {
    // If the URL doesn't specify doneScope, apply the saved preference (if any).
    if (doneScopeParam) return;
    try {
      const saved = normalizeScope(window.localStorage.getItem(STORAGE_KEY));
      if (!saved || saved === "week") return; // default is week

      const next = new URLSearchParams(sp.toString());
      if (props.weekStartIso) next.set("weekStart", props.weekStartIso);
      next.set("doneScope", saved);
      const qs = next.toString();
      const url = qs ? `/weekly?${qs}` : "/weekly";

      // Use history.replaceState to avoid navigation flicker and keep it lightweight.
      window.history.replaceState(null, "", url);
    } catch {
      // ignore
    }
  }, [doneScopeParam, props.weekStartIso, sp]);

  function buildHref(scope: DoneScope) {
    const next = new URLSearchParams(sp.toString());
    if (props.weekStartIso) next.set("weekStart", props.weekStartIso);
    next.set("doneScope", scope);
    const qs = next.toString();
    return qs ? `/weekly?${qs}` : "/weekly";
  }

  function persist(scope: DoneScope) {
    try {
      window.localStorage.setItem(STORAGE_KEY, scope);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        size="sm"
        variant={props.current === "week" ? "default" : "secondary"}
        data-testid="weekly-done-scope-week"
      >
        <Link href={buildHref("week")} onClick={() => persist("week")}>
          {props.labelWeekOnly}
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        variant={props.current === "all" ? "default" : "secondary"}
        data-testid="weekly-done-scope-all"
      >
        <Link href={buildHref("all")} onClick={() => persist("all")}>
          {props.labelAll}
        </Link>
      </Button>
    </div>
  );
}


