"use client";

import { useActionState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/app/actions/auth";

type Props = {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
};

/** A form that shows the server action's error and a pending state. */
export function ActionForm({ action, submitLabel, children, className }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className ?? "space-y-3"}>
      {children}
      {state?.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
