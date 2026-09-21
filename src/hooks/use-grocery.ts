"use client";

import useSWR from "swr";
import {
  addGroceryItem,
  clearCheckedItems,
  removeGroceryItem,
  setGroceryItemCategory,
  toggleGroceryItem,
} from "@/app/actions/grocery";
import type { GroceryItemView } from "@/components/grocery/types";
import type { GroceryCategory } from "@/generated/prisma/enums";
import { categorize } from "@/lib/categorize";

export const POLL_INTERVAL_MS = 3000;

async function fetcher(url: string): Promise<GroceryItemView[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

type Items = GroceryItemView[];

/**
 * Live grocery list: polls the server every few seconds and applies local
 * changes optimistically so taps feel instant regardless of poll timing.
 */
export function useGrocery(householdId: string, initialItems: Items) {
  const key = `/api/households/${householdId}/grocery`;
  const { data, error, mutate } = useSWR<Items>(key, fetcher, {
    fallbackData: initialItems,
    refreshInterval: POLL_INTERVAL_MS,
    dedupingInterval: 1000,
    revalidateOnFocus: true,
    keepPreviousData: true,
  });
  const items = data ?? initialItems;

  /** Runs a server action with an optimistic cache update. Resolves to an error message or null. */
  async function run(
    optimistic: (current: Items) => Items,
    action: () => Promise<{ error?: string } | void>,
  ): Promise<string | null> {
    try {
      await mutate(
        async () => {
          const result = await action();
          if (result && result.error) throw new Error(result.error);
          return fetcher(key);
        },
        {
          optimisticData: (current) => optimistic(current ?? []),
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        },
      );
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Something went wrong.";
    }
  }

  return {
    items,
    /** Set when polling fails (e.g. offline); SWR keeps retrying. */
    syncError: error as Error | undefined,
    addItem: (input: {
      name: string;
      quantity: string;
      category: GroceryCategory | null;
    }) => {
      const name = input.name.trim();
      return run(
        (cur) => [
          ...cur,
          {
            id: `temp-${crypto.randomUUID()}`,
            name,
            quantity: input.quantity.trim() || null,
            category: input.category ?? categorize(name),
            checked: false,
            addedByName: null,
            pending: true,
          },
        ],
        () => addGroceryItem(householdId, input),
      );
    },
    toggleItem: (id: string, checked: boolean) =>
      run(
        (cur) => cur.map((i) => (i.id === id ? { ...i, checked } : i)),
        () => toggleGroceryItem(id, checked),
      ),
    setCategory: (id: string, category: GroceryCategory) =>
      run(
        (cur) => cur.map((i) => (i.id === id ? { ...i, category } : i)),
        () => setGroceryItemCategory(id, category),
      ),
    removeItem: (id: string) =>
      run(
        (cur) => cur.filter((i) => i.id !== id),
        () => removeGroceryItem(id),
      ),
    clearChecked: () =>
      run(
        (cur) => cur.filter((i) => !i.checked),
        () => clearCheckedItems(householdId),
      ),
  };
}

export type GroceryApi = ReturnType<typeof useGrocery>;
