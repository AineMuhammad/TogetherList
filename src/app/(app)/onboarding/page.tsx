import { Home, KeyRound } from "lucide-react";
import { requireUser } from "@/lib/household";
import { createHousehold, joinHousehold } from "@/app/actions/household";
import { ActionForm } from "@/components/household/action-form";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const metadata = { title: "Set up your household" };

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-accent text-accent-foreground mb-3 flex size-11 items-center justify-center rounded-xl">
      {children}
    </span>
  );
}

export default async function OnboardingPage() {
  await requireUser();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Set up your household"
        description="Start a new household, or join one with a code from someone you live with."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <IconBadge>
              <Home className="size-5" />
            </IconBadge>
            <CardTitle className="text-lg">Create a household</CardTitle>
            <CardDescription>
              You&apos;ll get a code to share with the others.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={createHousehold} submitLabel="Create household">
              <div className="space-y-2">
                <Label htmlFor="name">Household name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="The Smiths"
                  required
                  maxLength={60}
                />
              </div>
            </ActionForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <IconBadge>
              <KeyRound className="size-5" />
            </IconBadge>
            <CardTitle className="text-lg">Join a household</CardTitle>
            <CardDescription>
              Enter the 6-character join code you were given.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActionForm action={joinHousehold} submitLabel="Join household">
              <div className="space-y-2">
                <Label htmlFor="code">Join code</Label>
                <Input
                  id="code"
                  name="code"
                  placeholder="ABC123"
                  required
                  maxLength={6}
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="font-mono text-lg tracking-[0.3em] uppercase"
                />
              </div>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
