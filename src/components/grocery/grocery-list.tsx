"use client";

import { ShoppingBasket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/categories";
import { CATEGORY_ICONS } from "./category-meta";
import { GroceryItemRow } from "./grocery-item-row";
import type { GroceryCategory } from "@/generated/prisma/enums";
import type { GroceryItemView } from "./types";

type Props = {
  items: GroceryItemView[];
  onToggle: (id: string, checked: boolean) => void;
  onSetCategory: (id: string, category: GroceryCategory) => void;
  onRemove: (id: string) => void;
  onClearChecked: () => void;
};

export function GroceryList({
  items,
  onToggle,
  onSetCategory,
  onRemove,
  onClearChecked,
}: Props) {
  const todo = items.filter((i) => !i.checked);
  const done = items.filter((i) => i.checked);

  if (items.length === 0) {
    return (
      <Card className="items-center px-6 py-14 text-center">
        <span className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-2xl">
          <ShoppingBasket className="size-7" />
        </span>
        <h2 className="mt-2 text-lg font-bold">Your list is empty</h2>
        <p className="text-muted-foreground max-w-sm">
          Add your first item above. We&apos;ll sort it into the right aisle for you.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {todo.length === 0 && (
        <Card className="items-center px-6 py-10 text-center">
          <h2 className="text-lg font-bold">All done! 🎉</h2>
          <p className="text-muted-foreground">
            Everything on the list has been checked off.
          </p>
        </Card>
      )}

      <div className="space-y-5 xl:block xl:columns-2 xl:gap-6 xl:space-y-0">
        {CATEGORY_ORDER.map((category) => {
          const group = todo.filter((i) => i.category === category);
          if (group.length === 0) return null;
          const Icon = CATEGORY_ICONS[category];
          return (
            <section
              key={category}
              aria-label={CATEGORY_LABELS[category]}
              className="xl:mb-5 xl:break-inside-avoid"
            >
              <h2 className="text-muted-foreground mb-2 flex items-center gap-2 px-1 text-sm font-bold tracking-wide uppercase">
                <Icon className="text-primary size-4" />
                {CATEGORY_LABELS[category]}
                <span className="bg-secondary rounded-full px-2 py-0.5 text-xs">
                  {group.length}
                </span>
              </h2>
              <Card className="gap-0 overflow-visible p-0">
                <ul className="divide-y">
                  {group.map((item) => (
                    <GroceryItemRow
                      key={item.id}
                      item={item}
                      onToggle={onToggle}
                      onSetCategory={onSetCategory}
                      onRemove={onRemove}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          );
        })}
      </div>

      {done.length > 0 && (
        <section aria-label="Checked off">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-muted-foreground text-sm font-bold tracking-wide uppercase">
              Checked off ({done.length})
            </h2>
            <Button variant="ghost" size="sm" onClick={onClearChecked}>
              Clear checked
            </Button>
          </div>
          <Card className="gap-0 overflow-visible p-0">
            <ul className="divide-y">
              {done.map((item) => (
                <GroceryItemRow
                  key={item.id}
                  item={item}
                  onToggle={onToggle}
                  onSetCategory={onSetCategory}
                  onRemove={onRemove}
                />
              ))}
            </ul>
          </Card>
        </section>
      )}
    </div>
  );
}
