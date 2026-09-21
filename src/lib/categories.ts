import type { GroceryCategory } from "@/generated/prisma/enums";

export const CATEGORY_ORDER: GroceryCategory[] = [
  "PRODUCE",
  "DAIRY",
  "MEAT",
  "PANTRY",
  "FROZEN",
  "HOUSEHOLD",
  "OTHER",
];

export const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  PRODUCE: "Produce",
  DAIRY: "Dairy & eggs",
  MEAT: "Meat & fish",
  PANTRY: "Pantry",
  FROZEN: "Frozen",
  HOUSEHOLD: "Household",
  OTHER: "Other",
};
