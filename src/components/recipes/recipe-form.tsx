"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { RecipeFormState } from "@/app/actions/recipes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  action: (state: RecipeFormState, formData: FormData) => Promise<RecipeFormState>;
  cancelHref: string;
  submitLabel: string;
  initial?: { name: string; ingredients: string[]; instructions: string | null };
};

export function RecipeForm({ action, cancelHref, submitLabel, initial }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  // After a failed submit the server hands the typed values back so nothing is lost.
  const v = state?.values;

  return (
    <Card className="p-0">
      <form action={formAction} className="space-y-6 p-5 sm:p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Recipe name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Spaghetti bolognese"
            maxLength={100}
            required
            defaultValue={v?.name ?? initial?.name ?? ""}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ingredients">Ingredients</Label>
          <Textarea
            id="ingredients"
            name="ingredients"
            rows={8}
            required
            placeholder={
              "500g minced beef\n1 onion\n2 cloves garlic\n400g canned tomatoes"
            }
            defaultValue={v?.ingredients ?? initial?.ingredients.join("\n") ?? ""}
            className="font-medium"
          />
          <p className="text-muted-foreground text-xs">
            One ingredient per line. Quantities are welcome, e.g. &quot;2 cups
            flour&quot;.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">
            Instructions{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="instructions"
            name="instructions"
            rows={7}
            placeholder="Brown the beef, add the onion and garlic…"
            defaultValue={v?.instructions ?? initial?.instructions ?? ""}
          />
        </div>

        {state?.error && (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm font-medium"
          >
            {state.error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : submitLabel}
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={cancelHref} />}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
