import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { HouseholdSwitcher } from "@/components/household/household-switcher";

type Props = {
  userName: string;
  households: { id: string; name: string }[];
  activeId: string | null;
};

export function AppHeader({ userName, households, activeId }: Props) {
  return (
    <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          TogetherList
        </Link>
        {activeId && (
          <nav className="text-muted-foreground flex items-center gap-3 text-sm">
            <Link href="/" className="hover:text-foreground">
              Grocery
            </Link>
            <Link href="/settings" className="hover:text-foreground">
              Settings
            </Link>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          <HouseholdSwitcher households={households} activeId={activeId} />
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              title={`Signed in as ${userName}`}
            >
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
