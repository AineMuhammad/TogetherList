import { ChefHat, Settings, ShoppingBasket, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// A later step adds the meal Planner here.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Grocery", icon: ShoppingBasket },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/settings", label: "Settings", icon: Settings },
];
