"use client";

import { useTransition } from "react";
import { setShoppingDay } from "@/app/actions/household";
import { SHOPPING_DAY_OPTIONS } from "@/lib/constants";

type Props = { householdId: string; value: string; disabled?: boolean };

export function ShoppingDaySelect({ householdId, value, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <select
      aria-label="Shopping day"
      defaultValue={value}
      disabled={disabled || pending}
      onChange={(e) => startTransition(() => setShoppingDay(householdId, e.target.value))}
      className="bg-background h-9 w-full rounded-md border px-3 text-sm disabled:opacity-60 sm:w-48"
    >
      {SHOPPING_DAY_OPTIONS.map((d) => (
        <option key={d.value} value={d.value}>
          {d.label}
        </option>
      ))}
    </select>
  );
}
