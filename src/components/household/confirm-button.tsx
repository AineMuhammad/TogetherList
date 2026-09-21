"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  action: () => Promise<void>;
  label: string;
  confirmText: string;
  variant?: "outline" | "destructive" | "ghost";
};

export function ConfirmButton({
  action,
  label,
  confirmText,
  variant = "outline",
}: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={pending}
      onClick={() => {
        if (window.confirm(confirmText)) startTransition(() => action());
      }}
    >
      {pending ? "…" : label}
    </Button>
  );
}
