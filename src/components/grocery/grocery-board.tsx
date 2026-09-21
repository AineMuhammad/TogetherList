"use client";

import { useState } from "react";
import { WifiOff, X } from "lucide-react";
import { useGrocery } from "@/hooks/use-grocery";
import { AddItemForm } from "./add-item-form";
import { GroceryList } from "./grocery-list";
import type { GroceryItemView } from "./types";

type Props = { householdId: string; initialItems: GroceryItemView[] };

/** Owns the live-synced list state and wires it to the form and list. */
export function GroceryBoard({ householdId, initialItems }: Props) {
  const grocery = useGrocery(householdId, initialItems);
  const [actionError, setActionError] = useState<string | null>(null);

  // Wrap mutations so a failed (rolled back) action surfaces a message.
  const report = async (promise: Promise<string | null>) => {
    const err = await promise;
    setActionError(err);
    return err;
  };

  return (
    <div className="space-y-6">
      {grocery.syncError && (
        <div
          role="status"
          className="bg-secondary text-secondary-foreground flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
        >
          <WifiOff className="size-4 shrink-0" />
          Can&apos;t reach the server. Showing the last synced list and retrying…
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
        >
          <span className="flex-1">{actionError}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setActionError(null)}
            className="hover:bg-destructive/10 cursor-pointer rounded-full p-0.5"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-24">
          <AddItemForm onAdd={(input) => grocery.addItem(input)} />
        </div>
        <GroceryList
          items={grocery.items}
          onToggle={(id, checked) => report(grocery.toggleItem(id, checked))}
          onSetCategory={(id, category) => report(grocery.setCategory(id, category))}
          onRemove={(id) => report(grocery.removeItem(id))}
          onClearChecked={() => report(grocery.clearChecked())}
        />
      </div>
    </div>
  );
}
