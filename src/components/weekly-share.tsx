"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { generateWeeklyReportText, postWeeklyToSlackAction } from "@/app/actions/weekly";

export function WeeklyShare(props: {
  weekStartIso: string;
  note: string;
  reportTitle: string;
  reportGenerate: string;
  reportGenerating: string;
  reportCopy: string;
  reportCopied: string;
  slackTitle: string;
  slackPost: string;
  reportPlaceholder: string;
}) {
  const [report, setReport] = useState("");
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const reportValue = useMemo(() => report.trim(), [report]);

  function onGenerate() {
    setCopied(false);
    startTransition(async () => {
      const res = await generateWeeklyReportText(props.weekStartIso);
      if (res.ok) setReport(res.text);
      else setReport("");
    });
  }

  async function onCopy() {
    setCopied(false);
    try {
      await navigator.clipboard.writeText(reportValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  }

  return (
    <>
      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{props.reportTitle}</h2>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onGenerate} disabled={isPending}>
              {isPending ? props.reportGenerating : props.reportGenerate}
            </Button>
            <Button type="button" variant="secondary" onClick={onCopy} disabled={!reportValue}>
              {copied ? props.reportCopied : props.reportCopy}
            </Button>
          </div>
        </div>

        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder={props.reportPlaceholder}
          className="min-h-32 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{props.slackTitle}</h2>
        <form action={postWeeklyToSlackAction} className="flex justify-end">
          <input type="hidden" name="weekStart" value={props.weekStartIso} />
          <input type="hidden" name="report" value={reportValue} />
          <input type="hidden" name="note" value={props.note} />
          <Button type="submit" variant="secondary" data-testid="weekly-post-to-slack">
            {props.slackPost}
          </Button>
        </form>
      </section>
    </>
  );
}


