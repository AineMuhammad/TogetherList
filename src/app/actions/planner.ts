"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { parseDateString } from "@/lib/dates";
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
