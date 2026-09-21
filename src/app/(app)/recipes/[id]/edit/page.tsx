import { updateRecipe } from "@/app/actions/recipes";
import { getRecipeForActiveHousehold } from "@/lib/recipes";
import { PageHeader } from "@/components/layout/page-header";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata = { title: "Edit recipe" };

export default async function EditRecipePage({
  params,
}: PageProps<"/recipes/[id]/edit">) {
  const { id } = await params;
  const recipe = await getRecipeForActiveHousehold(id);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Edit recipe" description={recipe.name} />
      <RecipeForm
        action={updateRecipe.bind(null, recipe.id)}
        cancelHref={`/recipes/${recipe.id}`}
        submitLabel="Save changes"
        initial={{
          name: recipe.name,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
        }}
      />
    </div>
  );
}
