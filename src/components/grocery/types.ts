import type { GroceryCategory } from "@/generated/prisma/enums";

export type GroceryItemView = {
  id: string;
  name: string;
  quantity: string | null;
  category: GroceryCategory;
  checked: boolean;
  addedByName: string | null;
};
