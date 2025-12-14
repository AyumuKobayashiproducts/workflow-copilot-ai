"use client";

import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { generateBreakdownSteps } from "@/app/actions/breakdown";
import { createTasksFromBreakdownAction } from "@/app/actions/tasks";

export function BreakdownGenerator(props: {
  goalLabel: string;
  goalPlaceholder: string;
  generateLabel: string;
  generatingLabel: string;
  clearLabel: string;
  stepsTitle: string;
  emptyDescription: string;
  saveToInboxLabel: string;
  errorEmptyGoal: string;
  errorNotConfigured: string;
  errorFailed: string;
}) {
  const [goal, setGoal] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stepsValue = useMemo(() => steps.join("\n"), [steps]);

  function onClear() {
    setGoal("");
    setSteps([]);
    setError(null);
  }

  function onGenerate() {
    setError(null);
    startTransition(async () => {
      const res = await generateBreakdownSteps(goal);
      if (res.ok) {
        setSteps(res.steps);
        return;
      }
      if (res.reason === "empty_goal") setError(props.errorEmptyGoal);
      else if (res.reason === "not_configured") setError(props.errorNotConfigured);
      else setError(props.errorFailed);
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="goal">
            {props.goalLabel}
          </label>
          <input
            id="goal"
            name="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={props.goalPlaceholder}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onGenerate} disabled={isPending}>
            {isPending ? props.generatingLabel : props.generateLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onClear}>
            {props.clearLabel}
          </Button>
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-neutral-300 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-medium">{props.stepsTitle}</h2>
          <form action={createTasksFromBreakdownAction}>
            <input type="hidden" name="steps" value={stepsValue} />
            <Button type="submit" variant="secondary" disabled={steps.length === 0}>
              {props.saveToInboxLabel}
            </Button>
          </form>
        </div>

        {steps.length === 0 ? (
          <p className="text-sm text-neutral-700">{props.emptyDescription}</p>
        ) : (
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {steps.map((s, i) => (
              <li key={`${i}-${s}`} className="text-neutral-900">
                {s}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}


