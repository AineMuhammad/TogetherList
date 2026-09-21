import { requireUser } from "@/lib/household";
import { createHousehold, joinHousehold } from "@/app/actions/household";
import { ActionForm } from "@/components/household/action-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function OnboardingPage() {
  await requireUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Set up your household</h1>
        <p className="text-muted-foreground">
          Start a new household, or join one with a code from someone you live with.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create a household</CardTitle>
            <CardDescription>
              You&apos;ll get a code to share with others.
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
            <CardTitle>Join a household</CardTitle>
            <CardDescription>Enter the 6-character join code.</CardDescription>
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
                  className="font-mono tracking-widest uppercase"
                />
              </div>
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
