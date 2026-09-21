"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { addGroceryItem } from "@/app/actions/grocery";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/categories";

export function AddItemForm({ householdId }: { householdId: string }) {
  const [state, formAction, pending] = useActionState(
    addGroceryItem.bind(null, householdId),
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const wasPending = useRef(false);

  // Clear and refocus once an add succeeds, ready for the next item.
  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      formRef.current?.reset();
      nameRef.current?.focus();
    }
    wasPending.current = pending;
  }, [pending, state]);

  return (
    <Card className="p-0">
      <form ref={formRef} action={formAction} className="space-y-3 p-4">
        <div className="flex gap-2">
          <Input
            ref={nameRef}
            name="name"
            placeholder="Add an item, e.g. milk"
            aria-label="Item name"
            autoComplete="off"
            maxLength={100}
            required
            className="flex-1"
          />
          <Input
            name="quantity"
            placeholder="Qty"
            aria-label="Quantity"
            autoComplete="off"
            maxLength={40}
            className="w-20 sm:w-28"
          />
        </div>
        <div className="flex gap-2">
          <NativeSelect
            name="category"
            aria-label="Category"
            defaultValue="AUTO"
            className="flex-1"
          >
            <option value="AUTO">Auto-detect category</option>
            {CATEGORY_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" disabled={pending}>
            <Plus /> {pending ? "Adding…" : "Add"}
          </Button>
        </div>
        {state?.error && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm font-medium"
          >
            {state.error}
          </p>
        )}
      </form>
    </Card>
  );
}
