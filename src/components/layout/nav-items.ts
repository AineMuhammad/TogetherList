import {
  CalendarDays,
  ChefHat,
  Settings,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Grocery", icon: ShoppingBasket },
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/settings", label: "Settings", icon: Settings },
];
