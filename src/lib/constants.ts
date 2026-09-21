import { ShoppingDay } from "@/generated/prisma/enums";

export const ACTIVE_HOUSEHOLD_COOKIE = "activeHouseholdId";

export const SHOPPING_DAY_OPTIONS: { value: ShoppingDay; label: string }[] = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];
