import { db } from "@/lib/db";
import { requireActiveMembership } from "@/lib/household";
import { AddItemForm } from "@/components/grocery/add-item-form";
import { GroceryList } from "@/components/grocery/grocery-list";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Grocery list" };

export default async function HomePage() {
  const { active } = await requireActiveMembership();
  const { household } = active;

  const items = await db.groceryItem.findMany({
    where: { householdId: household.id },
    include: { addedBy: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Grocery list"
        description={`Shared with everyone in ${household.name}.`}
      />
      <AddItemForm householdId={household.id} />
      <GroceryList
        householdId={household.id}
        items={items.map((i) => ({
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          category: i.category,
          checked: i.checked,
          addedByName: i.addedBy?.name ?? null,
        }))}
      />
    </div>
  );
}
