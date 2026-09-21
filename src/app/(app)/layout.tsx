import type { ReactNode } from "react";
import { getActiveMembership } from "@/lib/household";
import { AppHeader } from "@/components/layout/app-header";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, memberships, active } = await getActiveMembership();

  return (
    <div className="min-h-screen">
      <AppHeader
        userName={user.name ?? user.email ?? "Account"}
        userEmail={user.email ?? null}
        households={memberships.map((m) => ({
          id: m.householdId,
          name: m.household.name,
        }))}
        activeId={active?.householdId ?? null}
      />
      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 sm:pt-10 sm:pb-16">
        {children}
      </main>
    </div>
  );
}
