import Link from "next/link";
import { ShoppingBasket } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground shadow-primary/30 flex size-9 items-center justify-center rounded-xl shadow-sm",
        className,
      )}
    >
      <ShoppingBasket className="size-5" strokeWidth={2.25} />
    </span>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight">TogetherList</span>
    </Link>
  );
}
