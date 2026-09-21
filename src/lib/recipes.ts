import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireActiveMembership } from "@/lib/household";

/** Loads a recipe that belongs to the user's active household, or 404s. */
export async function getRecipeForActiveHousehold(id: string) {
  const { active } = await requireActiveMembership();
  const recipe = await db.recipe.findFirst({
    where: { id, householdId: active.householdId },
    include: { createdBy: { select: { name: true } } },
  });
  if (!recipe) notFound();
  return recipe;
}
