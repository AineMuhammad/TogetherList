"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ChevronsUpDown, House, Plus } from "lucide-react";
import { switchHousehold } from "@/app/actions/household";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = { households: { id: string; name: string }[]; activeId: string | null };

export function HouseholdSwitcher({ households, activeId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (households.length === 0) return null;
  const active = households.find((h) => h.id === activeId) ?? households[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Switch household"
        disabled={pending}
        className="bg-card hover:bg-muted focus-visible:ring-ring/50 flex h-10 max-w-44 min-w-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold shadow-xs transition-colors outline-none focus-visible:ring-3 disabled:opacity-60 sm:max-w-56"
      >
        <House className="text-primary size-4 shrink-0" />
        <span className="truncate">{active.name}</span>
        <ChevronsUpDown className="text-muted-foreground size-3.5 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="px-2">Your households</DropdownMenuLabel>
          {households.map((h) => (
            <DropdownMenuItem
              key={h.id}
              className="py-2 font-medium"
              onClick={() =>
                startTransition(async () => {
                  await switchHousehold(h.id);
                  router.refresh();
                })
              }
            >
              <span className="flex-1 truncate">{h.name}</span>
              {h.id === active.id && <Check className="text-primary" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="py-2 font-medium"
          onClick={() => router.push("/onboarding")}
        >
          <Plus /> Create or join a household
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
