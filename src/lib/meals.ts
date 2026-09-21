import type { MealSlot } from "@/generated/prisma/enums";

export const MEAL_SLOT_ORDER: MealSlot[] = ["BREAKFAST", "LUNCH", "DINNER"];

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
};
