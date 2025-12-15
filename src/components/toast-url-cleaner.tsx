"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ToastUrlCleaner(props: { param?: string }) {
  const key = props.param ?? "toast";
  const pathname = usePathname();
  const sp = useSearchParams();

  React.useEffect(() => {
    if (!pathname) return;
    const current = new URLSearchParams(sp.toString());
    if (!current.has(key)) return;
    current.delete(key);
    const qs = current.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    // Remove the toast from the URL without triggering a navigation/re-render.
    window.history.replaceState(null, "", url);
  }, [key, pathname, sp]);

  return null;
}


