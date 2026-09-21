"use client";

import Link from "next/link";
import { useState } from "react";
import { ChefHat, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type PickerRecipe = { id: string; name: string; ingredientCount: number };

type Props = {
  open: boolean;
  title: string;
  recipes: PickerRecipe[];
  /** Whether the household has any recipes at all (vs. all already planned here). */
  libraryEmpty: boolean;
  onPick: (recipe: PickerRecipe) => void;
  onClose: () => void;
};

export function RecipePicker({
  open,
  title,
  recipes,
  libraryEmpty,
  onPick,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? recipes.filter((r) => r.name.toLowerCase().includes(q)) : recipes;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setQuery("");
          onClose();
        }
      }}
    >
      <DialogContent className="max-h-[85dvh] gap-4 overflow-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{title}</DialogTitle>
          <DialogDescription>Pick a recipe from your library.</DialogDescription>
        </DialogHeader>

        {libraryEmpty ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-2xl">
              <ChefHat className="size-6" />
            </span>
            <p className="font-bold">No recipes yet</p>
            <p className="text-muted-foreground text-sm">
              Add a recipe first, then plan it here.
            </p>
            <Button
              className="mt-2"
              nativeButton={false}
              render={<Link href="/recipes/new" />}
            >
              Add a recipe
            </Button>
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="search"
                placeholder="Search recipes"
                aria-label="Search recipes"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <ul className="-mx-1 max-h-[50dvh] space-y-1 overflow-y-auto px-1">
              {shown.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      onPick(r);
                    }}
                    className="hover:bg-muted focus-visible:ring-ring/50 flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors outline-none focus-visible:ring-3"
                  >
                    <span className="min-w-0 truncate font-semibold">{r.name}</span>
                    <span className="text-muted-foreground shrink-0 text-xs font-medium">
                      {r.ingredientCount}{" "}
                      {r.ingredientCount === 1 ? "ingredient" : "ingredients"}
                    </span>
                  </button>
                </li>
              ))}
              {shown.length === 0 && (
                <li className="text-muted-foreground py-6 text-center text-sm">
                  {recipes.length === 0
                    ? "Every recipe is already planned for this meal."
                    : `No recipes match "${query}".`}
                </li>
              )}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
