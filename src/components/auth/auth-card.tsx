import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, RefreshCw, ShoppingBasket } from "lucide-react";
import { googleEnabled } from "@/auth";
import { Logo } from "@/components/layout/logo";
import { GoogleButton } from "./google-button";

type Props = {
  title: string;
  description: string;
  footerText: string;
  footerLink: { href: string; label: string };
  children: ReactNode;
};

const FEATURES = [
  { icon: ShoppingBasket, text: "One shared grocery list, sorted by aisle" },
  { icon: RefreshCw, text: "Check items off and everyone sees it in seconds" },
  { icon: CalendarDays, text: "Plan the week's meals and build the list automatically" },
];

export function AuthCard({
  title,
  description,
  footerText,
  footerLink,
  children,
}: Props) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="bg-primary text-primary-foreground relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-2xl" />
        <Logo className="relative [&>span:first-child]:bg-white/15 [&>span:first-child]:shadow-none" />
        <div className="relative max-w-md space-y-8">
          <h2 className="text-4xl leading-tight font-extrabold tracking-tight">
            Groceries and meals, sorted together.
          </h2>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 font-medium">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="size-4.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-primary-foreground/70 relative text-sm">
          Built for the people you share a kitchen with.
        </p>
      </aside>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2 mb-8">{description}</p>

          {googleEnabled && (
            <>
              <GoogleButton />
              <div className="text-muted-foreground my-6 flex items-center gap-3 text-xs font-semibold tracking-wider uppercase">
                <span className="bg-border h-px flex-1" />
                or
                <span className="bg-border h-px flex-1" />
              </div>
            </>
          )}
          {children}
          <p className="text-muted-foreground mt-8 text-center text-sm">
            {footerText}{" "}
            <Link
              href={footerLink.href}
              className="text-primary font-bold hover:underline"
            >
              {footerLink.label}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
