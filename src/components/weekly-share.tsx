"use client";

import { useMemo, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { generateWeeklyReportText, postWeeklyToSlackAction, saveWeeklyReportAction } from "@/app/actions/weekly";

function SlackPostButton(props: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} data-testid="weekly-post-to-slack">
      {pending ? props.pendingLabel : props.label}
    </Button>
  );
}

function ReportSaveButton(props: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending} data-testid="weekly-report-save">
      {pending ? props.pendingLabel : props.label}
    </Button>
  );
}

export function WeeklyShare(props: {
  weekStartIso: string;
  note: string;
  initialReport: string;
  reportTitle: string;
  reportTemplateLabel: string;
  reportTemplateStandard: string;
  reportTemplateShort: string;
  reportTemplateDetailed: string;
  reportGenerate: string;
  reportGenerating: string;
  reportSave: string;
  reportSaving: string;
  reportCopy: string;
  reportCopied: string;
  slackTitle: string;
  slackPost: string;
  slackPosting: string;
  reportPlaceholder: string;
  reportErrorFailed: string;
  reportErrorRateLimited: string;
}) {
  const [report, setReport] = useState(() => props.initialReport ?? "");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [template, setTemplate] = useState<"standard" | "short" | "detailed">("standard");

  const reportValue = useMemo(() => report.trim(), [report]);

  function onGenerate() {
    setCopied(false);
    setError(null);
    startTransition(async () => {
      const res = await generateWeeklyReportText(props.weekStartIso, template);
      if (res.ok) {
        setReport(res.text);
        return;
      }
      setReport("");
      if (res.reason === "rate_limited") setError(props.reportErrorRateLimited);
      else setError(props.reportErrorFailed);
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
            <Button
              type="button"
              variant="secondary"
              onClick={onGenerate}
              disabled={isPending}
              data-testid="weekly-report-generate"
            >
              {isPending ? props.reportGenerating : props.reportGenerate}
            </Button>
            <form action={saveWeeklyReportAction} className="flex">
              <input type="hidden" name="weekStart" value={props.weekStartIso} />
              <input type="hidden" name="report" value={reportValue} />
              <ReportSaveButton label={props.reportSave} pendingLabel={props.reportSaving} />
            </form>
            <Button type="button" variant="secondary" onClick={onCopy} disabled={!reportValue}>
              {copied ? props.reportCopied : props.reportCopy}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-neutral-700" htmlFor="weekly-report-template">
            {props.reportTemplateLabel}
          </label>
          <select
            id="weekly-report-template"
            value={template}
            onChange={(e) => setTemplate(e.target.value as "standard" | "short" | "detailed")}
            className="h-9 rounded-md border border-neutral-300 bg-white px-2 text-sm"
          >
            <option value="standard">{props.reportTemplateStandard}</option>
            <option value="short">{props.reportTemplateShort}</option>
            <option value="detailed">{props.reportTemplateDetailed}</option>
          </select>
        </div>

        <textarea
          value={report}
          onChange={(e) => setReport(e.target.value)}
          placeholder={props.reportPlaceholder}
          maxLength={2000}
          data-testid="weekly-report-textarea"
          className="min-h-32 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-medium">{props.slackTitle}</h2>
        <form action={postWeeklyToSlackAction} className="flex justify-end">
          <input type="hidden" name="weekStart" value={props.weekStartIso} />
          <input type="hidden" name="report" value={reportValue} />
          <input type="hidden" name="note" value={props.note} />
          <SlackPostButton label={props.slackPost} pendingLabel={props.slackPosting} />
        </form>
      </section>
    </>
  );
}


