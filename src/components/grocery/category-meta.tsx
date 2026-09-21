import {
  Apple,
  Beef,
  Milk,
  Package,
  SprayCan,
  Snowflake,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import type { GroceryCategory } from "@/generated/prisma/enums";

export const CATEGORY_ICONS: Record<GroceryCategory, LucideIcon> = {
  PRODUCE: Apple,
  DAIRY: Milk,
  MEAT: Beef,
  PANTRY: Wheat,
  FROZEN: Snowflake,
  HOUSEHOLD: SprayCan,
  OTHER: Package,
};
