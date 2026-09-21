"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, ShoppingBasket } from "lucide-react";
import { generateGroceryFromPlan, type GenerateResult } from "@/app/actions/planner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = { householdId: string; weekStart: string; plannedCount: number };

export function GenerateListCard({ householdId, weekStart, plannedCount }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<GenerateResult | null>(null);

  const added = result?.added?.length ?? 0;
  const updated = result?.updated?.length ?? 0;
  const skipped = result?.skipped?.length ?? 0;

  return (
    <Card className="mb-6 gap-4">
      <div className="flex flex-wrap items-center gap-4 px-5">
        <span className="bg-accent text-accent-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
          <ShoppingBasket className="size-5" />
        </span>
        <div className="min-w-0 flex-1 basis-56">
          <h2 className="font-bold">Ready to shop?</h2>
          <p className="text-muted-foreground text-sm">
            {plannedCount === 0
              ? "Plan a few meals below, then turn them into a grocery list."
              : `Combine the ingredients from ${plannedCount} planned ${plannedCount === 1 ? "meal" : "meals"} into your shared list. Items already listed just get their quantity raised.`}
          </p>
        </div>
        <Button
          disabled={pending || plannedCount === 0}
          onClick={() => {
            setResult(null);
            startTransition(async () =>
              setResult(await generateGroceryFromPlan(householdId, weekStart)),
            );
          }}
        >
          {pending ? "Adding…" : "Add to grocery list"}
        </Button>
      </div>

      {result?.error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive mx-5 rounded-lg px-3 py-2 text-sm font-semibold"
        >
          {result.error}
        </p>
      )}

      {result && !result.error && (
        <div
          role="status"
          className="bg-accent text-accent-foreground mx-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg px-3 py-2.5 text-sm font-semibold"
        >
          <Check className="size-4 shrink-0" />
          <span className="min-w-0 flex-1">
            {added + updated === 0
              ? "Your list already covers this week"
              : [
                  added > 0 && `Added ${added} new ${added === 1 ? "item" : "items"}`,
                  updated > 0 &&
                    `raised ${updated} ${updated === 1 ? "quantity" : "quantities"}`,
                ]
                  .filter(Boolean)
                  .join(", ")
                  .replace(/^./, (c) => c.toUpperCase())}
            {skipped > 0 && added + updated > 0 && ` · ${skipped} already covered`}
          </span>
          <Link href="/" className="underline underline-offset-2 hover:no-underline">
            View grocery list
          </Link>
        </div>
      )}
    </Card>
  );
}
