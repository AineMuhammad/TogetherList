"use client";

import Link from "next/link";
import { useState } from "react";
import { ChefHat, ListChecks, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export type RecipeSummary = {
  id: string;
  name: string;
  ingredientCount: number;
  preview: string;
};

export function RecipeLibrary({ recipes }: { recipes: RecipeSummary[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? recipes.filter((r) => r.name.toLowerCase().includes(q)) : recipes;

  if (recipes.length === 0) {
    return (
      <Card className="items-center px-6 py-14 text-center">
        <span className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-2xl">
          <ChefHat className="size-7" />
        </span>
        <h2 className="mt-2 text-lg font-bold">No recipes yet</h2>
        <p className="text-muted-foreground max-w-sm">
          Save your household&apos;s go-to meals, then plan them into the week.
        </p>
        <Button
          className="mt-3"
          nativeButton={false}
          render={<Link href="/recipes/new" />}
        >
          <Plus /> Add your first recipe
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
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

      {shown.length === 0 ? (
        <p className="text-muted-foreground py-10 text-center">
          No recipes match &quot;{query}&quot;.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {shown.map((r) => (
            <li key={r.id}>
              <Link
                href={`/recipes/${r.id}`}
                className="focus-visible:ring-ring/50 block h-full rounded-2xl outline-none focus-visible:ring-3"
              >
                <Card className="h-full gap-2 transition-shadow hover:shadow-md">
                  <div className="px-5">
                    <h2 className="truncate text-lg font-bold">{r.name}</h2>
                    <p className="text-primary mt-1 flex items-center gap-1.5 text-sm font-semibold">
                      <ListChecks className="size-4" />
                      {r.ingredientCount}{" "}
                      {r.ingredientCount === 1 ? "ingredient" : "ingredients"}
                    </p>
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                      {r.preview}
                    </p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
