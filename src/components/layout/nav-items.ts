import { Settings, ShoppingBasket, type LucideIcon } from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Later steps add Recipes and Planner here.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Grocery", icon: ShoppingBasket },
  { href: "/settings", label: "Settings", icon: Settings },
];
