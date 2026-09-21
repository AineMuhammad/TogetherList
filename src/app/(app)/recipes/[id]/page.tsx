import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { deleteRecipe } from "@/app/actions/recipes";
import { getRecipeForActiveHousehold } from "@/lib/recipes";
import { ConfirmButton } from "@/components/household/confirm-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RecipePage({ params }: PageProps<"/recipes/[id]">) {
  const { id } = await params;
  const recipe = await getRecipeForActiveHousehold(id);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/recipes" />}
      >
        <ArrowLeft /> All recipes
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight break-words sm:text-3xl">
            {recipe.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            {recipe.ingredients.length} ingredients
            {recipe.createdBy?.name ? ` · added by ${recipe.createdBy.name}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`/recipes/${recipe.id}/edit`} />}
          >
            <Pencil /> Edit
          </Button>
          <ConfirmButton
            action={deleteRecipe.bind(null, recipe.id)}
            label="Delete"
            variant="destructive"
            confirmText={`Delete "${recipe.name}"? It will also be removed from any planned meals.`}
          />
        </div>
      </div>

      <div
        className={
          recipe.instructions
            ? "grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-start"
            : "max-w-lg"
        }
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recipe.ingredients.map((line, i) => (
                <li key={i} className="flex gap-3 font-medium break-words">
                  <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
                  {line}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {recipe.instructions && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed break-words whitespace-pre-wrap">
                {recipe.instructions}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
