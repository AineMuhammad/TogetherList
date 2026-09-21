import { requireActiveMembership } from "@/lib/household";
import { getGroceryItems } from "@/lib/grocery";
import { GroceryBoard } from "@/components/grocery/grocery-board";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = { title: "Grocery list" };

export default async function HomePage() {
  const { active } = await requireActiveMembership();
  const { household } = active;
  const initialItems = await getGroceryItems(household.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grocery list"
        description={`Shared with everyone in ${household.name}.`}
      />
      {/* Keyed so switching households resets the live list state. */}
      <GroceryBoard
        key={household.id}
        householdId={household.id}
        initialItems={initialItems}
      />
    </div>
  );
}
