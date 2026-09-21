import { HouseholdSwitcher } from "@/components/household/household-switcher";
import { Logo } from "./logo";
import { MobileNav, NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";

type Props = {
  userName: string;
  userEmail: string | null;
  households: { id: string; name: string }[];
  activeId: string | null;
};

export function AppHeader({ userName, userEmail, households, activeId }: Props) {
  return (
    <>
      <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur-lg">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:gap-6">
          <Logo className="shrink-0 [&>span:last-child]:hidden sm:[&>span:last-child]:inline" />
          {activeId && <NavLinks />}
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <HouseholdSwitcher households={households} activeId={activeId} />
            <UserMenu name={userName} email={userEmail} />
          </div>
        </div>
      </header>
      {activeId && <MobileNav />}
    </>
  );
}
