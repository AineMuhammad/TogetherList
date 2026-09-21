import Link from "next/link";
import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { googleEnabled } from "@/auth";
import { GoogleButton } from "./google-button";

type Props = {
  title: string;
  description: string;
  footerText: string;
  footerLink: { href: string; label: string };
  children: ReactNode;
};

export function AuthCard({
  title,
  description,
  footerText,
  footerLink,
  children,
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {googleEnabled && (
            <>
              <GoogleButton />
              <div className="text-muted-foreground flex items-center gap-3 text-xs">
                <span className="bg-border h-px flex-1" />
                or
                <span className="bg-border h-px flex-1" />
              </div>
            </>
          )}
          {children}
          <p className="text-muted-foreground text-center text-sm">
            {footerText}{" "}
            <Link
              href={footerLink.href}
              className="text-foreground font-medium underline"
            >
              {footerLink.label}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
