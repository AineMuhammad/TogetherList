"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { categorize } from "@/lib/categorize";
import { getMembership, requireUser } from "@/lib/household";
import { groceryItemSchema } from "@/lib/validation";
import { GroceryCategory } from "@/generated/prisma/enums";
import type { FormState } from "@/app/actions/auth";

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
  _: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireMember(householdId);

  const override = formData.get("category");
  const parsed = groceryItemSchema.safeParse({
    name: formData.get("name") ?? "",
    quantity: formData.get("quantity") ?? "",
    category: override && override !== "AUTO" ? override : null,
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
  revalidatePath("/");
  return undefined;
}

export async function toggleGroceryItem(itemId: string, checked: boolean) {
  const item = await requireItem(itemId);
  if (!item) return;
  await db.groceryItem.update({
    where: { id: itemId },
    data: { checked, checkedAt: checked ? new Date() : null },
  });
  revalidatePath("/");
}

export async function setGroceryItemCategory(itemId: string, category: string) {
  const parsed = GroceryCategory[category as keyof typeof GroceryCategory];
  if (!parsed) return;
  const item = await requireItem(itemId);
  if (!item) return;
  await db.groceryItem.update({ where: { id: itemId }, data: { category: parsed } });
  revalidatePath("/");
}

export async function removeGroceryItem(itemId: string) {
  const item = await requireItem(itemId);
  if (!item) return;
  await db.groceryItem.delete({ where: { id: itemId } });
  revalidatePath("/");
}

export async function clearCheckedItems(householdId: string) {
  await requireMember(householdId);
  await db.groceryItem.deleteMany({ where: { householdId, checked: true } });
  revalidatePath("/");
}
