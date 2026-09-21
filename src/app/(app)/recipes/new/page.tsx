import { createRecipe } from "@/app/actions/recipes";
import { requireActiveMembership } from "@/lib/household";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata = { title: "New recipe" };

export default async function NewRecipePage() {
  const { active } = await requireActiveMembership();

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="New recipe"
        description="Add a meal to your household's library."
      />
      <RecipeForm
        action={createRecipe.bind(null, active.householdId)}
        cancelHref="/recipes"
        submitLabel="Save recipe"
      />
    </div>
  );
}
