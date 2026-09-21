"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { GroceryCategory } from "@/generated/prisma/enums";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/categories";

type Props = {
  onAdd: (input: {
    name: string;
    quantity: string;
    category: GroceryCategory | null;
  }) => Promise<string | null>;
};

export function AddItemForm({ onAdd }: Props) {
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  return (
    <Card className="p-0">
      <form
        ref={formRef}
        className="space-y-3 p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const name = String(data.get("name") ?? "").trim();
          if (!name) return setError("Enter an item");
          const category = String(data.get("category") ?? "AUTO");

          // The item appears instantly, so clear the form right away.
          setError(null);
          const input = {
            name,
            quantity: String(data.get("quantity") ?? ""),
            category: category === "AUTO" ? null : (category as GroceryCategory),
          };
          formRef.current?.reset();
          nameRef.current?.focus();

          const err = await onAdd(input);
          if (err) setError(err);
        }}
      >
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
          <Button type="submit">
            <Plus /> Add
          </Button>
        </div>
        {error && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm font-medium"
          >
            {error}
          </p>
        )}
      </form>
    </Card>
  );
}
