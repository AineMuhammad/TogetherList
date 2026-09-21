import type { ReactNode } from "react";
import { getActiveMembership } from "@/lib/household";
import { AppHeader } from "@/components/layout/app-header";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, memberships, active } = await getActiveMembership();

  return (
    <div className="min-h-dvh">
      <AppHeader
        userName={user.name ?? user.email ?? "Account"}
        userEmail={user.email ?? null}
        households={memberships.map((m) => ({
          id: m.householdId,
          name: m.household.name,
        }))}
        activeId={active?.householdId ?? null}
      />
      <main className="mx-auto w-full max-w-[90rem] px-4 pt-6 pb-28 sm:px-6 md:pt-10 md:pb-16 lg:px-8">
        {children}
      </main>
    </div>
  );
}
