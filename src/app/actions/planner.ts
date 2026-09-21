"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { categorize } from "@/lib/categorize";
import { addDays, parseDateString, startOfWeek } from "@/lib/dates";
import { ingredientKey, mergeIngredients } from "@/lib/ingredients";
import { getMembership, requireUser } from "@/lib/household";
import { MealSlot } from "@/generated/prisma/enums";

async function requireMember(householdId: string) {
  const user = await requireUser();
  if (!(await getMembership(user.id, householdId)))
    throw new Error("Not a member of this household.");
}

export async function addMealPlanEntry(
  recipeId: string,
  date: string,
  slot: string,
): Promise<{ error?: string }> {
  const day = parseDateString(date);
  const mealSlot = MealSlot[slot as keyof typeof MealSlot];
  if (!day || !mealSlot) return { error: "That date or meal isn't valid." };

  const recipe = await db.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) return { error: "That recipe no longer exists." };
  await requireMember(recipe.householdId);

  const existing = await db.mealPlanEntry.findFirst({
    where: { householdId: recipe.householdId, date: day, mealSlot, recipeId },
  });
  if (!existing) {
    await db.mealPlanEntry.create({
      data: { householdId: recipe.householdId, date: day, mealSlot, recipeId },
    });
  }
  revalidatePath("/planner");
  return {};
}

export async function removeMealPlanEntry(entryId: string): Promise<{ error?: string }> {
  const entry = await db.mealPlanEntry.findUnique({ where: { id: entryId } });
  if (entry) {
    await requireMember(entry.householdId);
    await db.mealPlanEntry.delete({ where: { id: entryId } });
  }
  revalidatePath("/planner");
  return {};
}

export type GenerateResult = { error?: string; added?: string[]; skipped?: string[] };

/**
 * Turns the week's planned meals into grocery items: ingredient lines from every
 * planned recipe are merged, and anything already on the list (unchecked) is skipped.
 */
export async function generateGroceryFromPlan(
  householdId: string,
  weekStart: string,
): Promise<GenerateResult> {
  const user = await requireUser();
  if (!(await getMembership(user.id, householdId)))
    return { error: "Not a member of this household." };
  if (!parseDateString(weekStart)) return { error: "That week isn't valid." };

  const start = startOfWeek(weekStart);
  const entries = await db.mealPlanEntry.findMany({
    where: {
      householdId,
      date: { gte: parseDateString(start)!, lte: parseDateString(addDays(start, 6))! },
    },
    include: { recipe: { select: { ingredients: true } } },
  });
  if (entries.length === 0) return { error: "No meals are planned for this week yet." };

  // Each planned meal counts, so a recipe planned twice doubles its ingredients.
  const merged = mergeIngredients(entries.flatMap((e) => e.recipe.ingredients));

  const unchecked = await db.groceryItem.findMany({
    where: { householdId, checked: false },
    select: { name: true },
  });
  const onList = new Set(unchecked.map((i) => ingredientKey(i.name)));

  const toAdd = merged.filter((m) => !onList.has(m.key));
  const skipped = merged.filter((m) => onList.has(m.key)).map((m) => m.name);

  if (toAdd.length > 0) {
    await db.groceryItem.createMany({
      data: toAdd.map((m) => ({
        householdId,
        name: m.name.slice(0, 100),
        quantity: m.quantity,
        category: categorize(m.name),
        addedById: user.id,
      })),
    });
  }
  revalidatePath("/");
  return { added: toAdd.map((m) => m.name), skipped };
}
