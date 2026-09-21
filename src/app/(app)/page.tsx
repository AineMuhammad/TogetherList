import { requireActiveMembership } from "@/lib/household";

export default async function HomePage() {
  const { active } = await requireActiveMembership();

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{active.household.name}</h1>
      <p className="text-muted-foreground">
        Your shared grocery list will live here. (Coming in the next step.)
      </p>
    </div>
  );
}
