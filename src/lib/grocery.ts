import { db } from "@/lib/db";
import type { GroceryItemView } from "@/components/grocery/types";

/** All items for a household, in the shape the client renders. */
export async function getGroceryItems(householdId: string): Promise<GroceryItemView[]> {
  const items = await db.groceryItem.findMany({
    where: { householdId },
    include: { addedBy: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return items.map((i) => ({
    id: i.id,
    name: i.name,
    quantity: i.quantity,
    category: i.category,
    checked: i.checked,
    addedByName: i.addedBy?.name ?? null,
  }));
}
