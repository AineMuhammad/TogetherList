import { ShoppingBasket } from "lucide-react";
import { requireActiveMembership } from "@/lib/household";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Grocery list" };

export default async function HomePage() {
  const { active } = await requireActiveMembership();

  return (
    <>
      <PageHeader
        title="Grocery list"
        description={`Shared with everyone in ${active.household.name}.`}
      />
      <Card className="items-center px-6 py-14 text-center">
        <span className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-2xl">
          <ShoppingBasket className="size-7" />
        </span>
        <h2 className="mt-2 text-lg font-bold">Your list is coming soon</h2>
        <p className="text-muted-foreground max-w-sm">
          Add and check off groceries together. This arrives in the next update.
        </p>
      </Card>
    </>
  );
}
