"use client";

import { Check, Ellipsis, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GroceryCategory } from "@/generated/prisma/enums";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { GroceryItemView } from "./types";
import { CATEGORY_ICONS } from "./category-meta";

type Props = {
  item: GroceryItemView;
  onToggle: (id: string, checked: boolean) => void;
  onSetCategory: (id: string, category: GroceryCategory) => void;
  onRemove: (id: string) => void;
};

export function GroceryItemRow({ item, onToggle, onSetCategory, onRemove }: Props) {
  const pending = !!item.pending;

  return (
    <li className={cn("flex items-center gap-3 px-4 py-2.5", pending && "opacity-60")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={`${item.checked ? "Uncheck" : "Check off"} ${item.name}`}
        disabled={pending}
        onClick={() => onToggle(item.id, !item.checked)}
        className={cn(
          "focus-visible:ring-ring/50 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors outline-none focus-visible:ring-3",
          item.checked
            ? "border-primary bg-primary text-primary-foreground"
            : "border-input hover:border-primary",
        )}
      >
        {item.checked && <Check className="size-4" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate font-semibold",
            item.checked && "text-muted-foreground line-through",
          )}
        >
          {item.name}
        </p>
        {item.addedByName && (
          <p className="text-muted-foreground truncate text-xs">
            Added by {item.addedByName}
          </p>
        )}
      </div>

      {item.quantity && (
        <span className="bg-secondary text-secondary-foreground shrink-0 rounded-full px-2.5 py-1 text-xs font-bold">
          {item.quantity}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          aria-label={`Options for ${item.name}`}
          className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring/50 flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-3"
        >
          <Ellipsis className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-2">Move to</DropdownMenuLabel>
            {CATEGORY_ORDER.map((c) => {
              const Icon = CATEGORY_ICONS[c];
              return (
                <DropdownMenuItem
                  key={c}
                  className="py-2"
                  onClick={() => onSetCategory(item.id, c)}
                >
                  <Icon /> <span className="flex-1">{CATEGORY_LABELS[c]}</span>
                  {c === item.category && <Check className="text-primary" />}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="py-2"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 /> Remove item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}
