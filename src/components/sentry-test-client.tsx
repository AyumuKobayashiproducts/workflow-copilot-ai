"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";

export function SentryTestClient() {
  const [sent, setSent] = useState(false);

  function onSend() {
    const err = new Error("Sentry test error (manual)");
    Sentry.captureException(err);
    // eslint-disable-next-line no-console
    console.error(err);
    setSent(true);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-700">
        This page sends a test error to Sentry when you click the button.
      </p>
      <div className="flex items-center gap-2">
        <Button type="button" onClick={onSend} disabled={sent}>
          {sent ? "Sent" : "Send test error"}
        </Button>
      </div>
      {sent ? <p className="text-xs text-neutral-600">Check Sentry → Issues.</p> : null}
    </div>
  );
}


