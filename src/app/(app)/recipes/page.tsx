import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireActiveMembership } from "@/lib/household";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeLibrary } from "@/components/recipes/recipe-library";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Recipes" };

export default async function RecipesPage() {
  const { active } = await requireActiveMembership();
  const recipes = await db.recipe.findMany({
    where: { householdId: active.householdId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        title="Recipes"
        description={`${active.household.name}'s recipe library.`}
        actions={
          recipes.length > 0 ? (
            <Button nativeButton={false} render={<Link href="/recipes/new" />}>
              <Plus /> New recipe
            </Button>
          ) : undefined
        }
      />
      <RecipeLibrary
        recipes={recipes.map((r) => ({
          id: r.id,
          name: r.name,
          ingredientCount: r.ingredients.length,
          preview: r.ingredients.slice(0, 4).join(", "),
        }))}
      />
    </div>
  );
}
