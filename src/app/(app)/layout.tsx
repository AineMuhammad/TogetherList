import type { ReactNode } from "react";
import { getActiveMembership } from "@/lib/household";
import { AppHeader } from "@/components/layout/app-header";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, memberships, active } = await getActiveMembership();

  return (
    <div className="min-h-screen">
      <AppHeader
        userName={user.name ?? user.email ?? "Account"}
        households={memberships.map((m) => ({
          id: m.householdId,
          name: m.household.name,
        }))}
        activeId={active?.householdId ?? null}
      />
      <main className="mx-auto w-full max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
