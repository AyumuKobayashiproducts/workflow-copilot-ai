"use client";

import * as React from "react";

import { updateTaskTitleAction } from "@/app/actions/tasks";
import { Button } from "@/components/ui/button";

export function TaskTitleInlineEdit(props: {
  taskId: string;
  title: string;
  done?: boolean;
  editLabel: string;
  saveLabel: string;
  cancelLabel: string;
  redirectTo: string;
}) {
  const [editing, setEditing] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  return (
    <div className="min-w-0">
      {editing ? (
        <form action={updateTaskTitleAction} className="flex gap-2" onReset={() => setEditing(false)}>
          <input type="hidden" name="id" value={props.taskId} />
          <input type="hidden" name="redirectTo" value={props.redirectTo} />
          <input
            ref={inputRef}
            name="title"
            defaultValue={props.title}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
              }
            }}
          />
          <Button type="submit" size="sm" variant="secondary" className="shrink-0">
            {props.saveLabel}
          </Button>
          <button
            type="button"
            className="shrink-0 text-sm text-neutral-700 underline-offset-4 hover:underline"
            onClick={() => setEditing(false)}
          >
            {props.cancelLabel}
          </button>
        </form>
      ) : (
        <div className="flex min-w-0 items-center gap-2">
          <div
            className={
              props.done ? "truncate text-sm line-through text-neutral-600" : "truncate text-sm text-neutral-900"
            }
          >
            {props.title}
          </div>
          <button
            type="button"
            className="shrink-0 text-xs text-neutral-700 underline-offset-4 hover:underline"
            onClick={() => setEditing(true)}
          >
            {props.editLabel}
          </button>
        </div>
      )}
    </div>
  );
}


