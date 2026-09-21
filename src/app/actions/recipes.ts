"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getMembership, requireUser } from "@/lib/household";
import { recipeSchema } from "@/lib/validation";

export type RecipeFormState =
  | {
      error?: string;
      values?: { name: string; ingredients: string; instructions: string };
    }
  | undefined;

function readForm(formData: FormData) {
  const values = {
    name: String(formData.get("name") ?? ""),
    ingredients: String(formData.get("ingredients") ?? ""),
    instructions: String(formData.get("instructions") ?? ""),
  };
  return { values, parsed: recipeSchema.safeParse(values) };
}

async function requireMember(householdId: string) {
  const user = await requireUser();
  if (!(await getMembership(user.id, householdId)))
    throw new Error("Not a member of this household.");
  return user;
}

export async function createRecipe(
  householdId: string,
  _: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const user = await requireMember(householdId);
  const { values, parsed } = readForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  const recipe = await db.recipe.create({
    data: { householdId, createdById: user.id, ...parsed.data },
  });
  revalidatePath("/recipes");
  redirect(`/recipes/${recipe.id}`);
}

export async function updateRecipe(
  recipeId: string,
  _: RecipeFormState,
  formData: FormData,
): Promise<RecipeFormState> {
  const existing = await db.recipe.findUnique({ where: { id: recipeId } });
  if (!existing) return { error: "This recipe no longer exists." };
  await requireMember(existing.householdId);

  const { values, parsed } = readForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values };

  await db.recipe.update({ where: { id: recipeId }, data: parsed.data });
  revalidatePath("/recipes");
  redirect(`/recipes/${recipeId}`);
}

export async function deleteRecipe(recipeId: string) {
  const existing = await db.recipe.findUnique({ where: { id: recipeId } });
  if (existing) {
    await requireMember(existing.householdId);
    await db.recipe.delete({ where: { id: recipeId } }); // meal plan entries cascade
    revalidatePath("/recipes");
  }
  redirect("/recipes");
}
