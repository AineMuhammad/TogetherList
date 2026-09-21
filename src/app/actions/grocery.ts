"use server";

import { db } from "@/lib/db";
import { categorize } from "@/lib/categorize";
import { getMembership, requireUser } from "@/lib/household";
import { groceryItemSchema } from "@/lib/validation";
import { GroceryCategory } from "@/generated/prisma/enums";

async function requireMember(householdId: string) {
  const user = await requireUser();
  if (!(await getMembership(user.id, householdId)))
    throw new Error("Not a member of this household.");
  return user;
}

/** Loads an item the current user is allowed to modify. */
async function requireItem(itemId: string) {
  const item = await db.groceryItem.findUnique({ where: { id: itemId } });
  if (!item) return null;
  await requireMember(item.householdId);
  return item;
}

export async function addGroceryItem(
  householdId: string,
  input: { name: string; quantity?: string; category?: string | null },
): Promise<{ error?: string }> {
  const user = await requireMember(householdId);

  const parsed = groceryItemSchema.safeParse({
    name: input.name ?? "",
    quantity: input.quantity ?? "",
    category: input.category && input.category !== "AUTO" ? input.category : null,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, quantity, category } = parsed.data;

  await db.groceryItem.create({
    data: {
      householdId,
      name,
      quantity,
      category: category ?? categorize(name),
      addedById: user.id,
    },
  });
  return {};
}

export async function toggleGroceryItem(itemId: string, checked: boolean) {
  const item = await requireItem(itemId);
  if (!item) return;
  await db.groceryItem.update({
    where: { id: itemId },
    data: { checked, checkedAt: checked ? new Date() : null },
  });
}

export async function setGroceryItemCategory(itemId: string, category: string) {
  const parsed = GroceryCategory[category as keyof typeof GroceryCategory];
  if (!parsed) return;
  const item = await requireItem(itemId);
  if (!item) return;
  await db.groceryItem.update({ where: { id: itemId }, data: { category: parsed } });
}

export async function removeGroceryItem(itemId: string) {
  const item = await requireItem(itemId);
  if (!item) return;
  await db.groceryItem.delete({ where: { id: itemId } });
}

export async function clearCheckedItems(householdId: string) {
  await requireMember(householdId);
  await db.groceryItem.deleteMany({ where: { householdId, checked: true } });
}
