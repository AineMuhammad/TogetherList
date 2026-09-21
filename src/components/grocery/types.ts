import type { GroceryCategory } from "@/generated/prisma/enums";

export type GroceryItemView = {
  id: string;
  name: string;
  quantity: string | null;
  category: GroceryCategory;
  checked: boolean;
  addedByName: string | null;
  /** True for an optimistic item the server hasn't confirmed yet. */
  pending?: boolean;
};
