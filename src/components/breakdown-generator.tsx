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
  addStepLabel: string;
  deleteStepLabel: string;
  moveUpLabel: string;
  moveDownLabel: string;
  stepPlaceholder: string;
  errorEmptyGoal: string;
  errorGoalTooLong: string;
  errorNotConfigured: string;
  errorRateLimited: string;
  errorFailed: string;
}) {
  const [goal, setGoal] = useState("");
  const [steps, setSteps] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const stepsForSave = useMemo(() => steps.map((s) => s.trim()).filter(Boolean), [steps]);
  const stepsValue = useMemo(() => stepsForSave.join("\n"), [stepsForSave]);

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
      else if (res.reason === "goal_too_long") setError(props.errorGoalTooLong);
      else if (res.reason === "not_configured") setError(props.errorNotConfigured);
      else if (res.reason === "rate_limited") setError(props.errorRateLimited);
      else setError(props.errorFailed);
    });
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addStep() {
    setSteps((prev) => [...prev, ""]);
  }

  function deleteStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  function moveStep(index: number, dir: -1 | 1) {
    setSteps((prev) => {
      const next = prev.slice();
      const to = index + dir;
      if (to < 0 || to >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[to]!;
      next[to] = tmp;
      return next;
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
            data-testid="breakdown-goal-input"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={onGenerate} disabled={isPending} data-testid="breakdown-generate">
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
            <Button
              type="submit"
              variant="secondary"
              disabled={stepsForSave.length === 0}
              data-testid="breakdown-save-to-inbox"
            >
              {props.saveToInboxLabel}
            </Button>
          </form>
        </div>

        {steps.length === 0 ? (
          <p className="text-sm text-neutral-700">{props.emptyDescription}</p>
        ) : (
          <ol className="space-y-2">
            {steps.map((s, i) => (
              <li key={`${i}`} className="flex items-start gap-2">
                <div className="mt-2 w-6 shrink-0 text-right text-xs text-neutral-500">{i + 1}.</div>
                <input
                  value={s}
                  onChange={(e) => updateStep(i, e.target.value)}
                  placeholder={props.stepPlaceholder}
                  data-testid="breakdown-step-input"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => moveStep(i, -1)}
                    disabled={i === 0}
                  >
                    {props.moveUpLabel}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => moveStep(i, 1)}
                    disabled={i === steps.length - 1}
                  >
                    {props.moveDownLabel}
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => deleteStep(i)}>
                    {props.deleteStepLabel}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={addStep} data-testid="breakdown-add-step">
            {props.addStepLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}


