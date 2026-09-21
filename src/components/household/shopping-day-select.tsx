"use client";

import { useTransition } from "react";
import { setShoppingDay } from "@/app/actions/household";
import { NativeSelect } from "@/components/ui/native-select";
import { SHOPPING_DAY_OPTIONS } from "@/lib/constants";

type Props = { householdId: string; value: string; disabled?: boolean };

export function ShoppingDaySelect({ householdId, value, disabled }: Props) {
  const [pending, startTransition] = useTransition();
  return (
    <NativeSelect
      aria-label="Shopping day"
      defaultValue={value}
      disabled={disabled || pending}
      onChange={(e) => startTransition(() => setShoppingDay(householdId, e.target.value))}
      className="sm:w-56"
    >
      {SHOPPING_DAY_OPTIONS.map((d) => (
        <option key={d.value} value={d.value}>
          {d.label}
        </option>
      ))}
    </NativeSelect>
  );
}
