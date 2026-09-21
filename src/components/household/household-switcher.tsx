"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { switchHousehold } from "@/app/actions/household";

const NEW_HOUSEHOLD = "__new__";

type Props = { households: { id: string; name: string }[]; activeId: string | null };

export function HouseholdSwitcher({ households, activeId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (households.length === 0) return null;

  return (
    <select
      aria-label="Switch household"
      value={activeId ?? ""}
      disabled={pending}
      onChange={(e) => {
        const value = e.target.value;
        if (value === NEW_HOUSEHOLD) return router.push("/onboarding");
        startTransition(async () => {
          await switchHousehold(value);
          router.refresh();
        });
      }}
      className="bg-background h-8 max-w-40 rounded-md border px-2 text-sm disabled:opacity-60"
    >
      {households.map((h) => (
        <option key={h.id} value={h.id}>
          {h.name}
        </option>
      ))}
      <option value={NEW_HOUSEHOLD}>+ Create or join…</option>
    </select>
  );
}
