import { db } from "@/lib/db";
import { requireActiveMembership } from "@/lib/household";
import { leaveHousehold, removeMember, renameHousehold } from "@/app/actions/household";
import { ActionForm } from "@/components/household/action-form";
import { ConfirmButton } from "@/components/household/confirm-button";
import { CopyButton } from "@/components/household/copy-button";
import { ShoppingDaySelect } from "@/components/household/shopping-day-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SettingsPage() {
  const { user, active } = await requireActiveMembership();
  const { household } = active;
  const isOwner = active.role === "OWNER";

  const members = await db.householdMember.findMany({
    where: { householdId: household.id },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Household settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Join code</CardTitle>
          <CardDescription>
            Share this code so others can join {household.name}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <code className="bg-muted rounded-md px-3 py-1.5 font-mono text-lg tracking-widest">
            {household.joinCode}
          </code>
          <CopyButton value={household.joinCode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          {!isOwner && (
            <CardDescription>Only the owner can change these.</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <ActionForm
            action={renameHousehold.bind(null, household.id)}
            submitLabel="Rename"
            className="flex flex-wrap items-end gap-3"
          >
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="name">Household name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={household.name}
                maxLength={60}
                required
                disabled={!isOwner}
                key={household.name}
              />
            </div>
          </ActionForm>
          <div className="space-y-2">
            <Label>Shopping day</Label>
            <ShoppingDaySelect
              householdId={household.id}
              value={household.shoppingDay}
              disabled={!isOwner}
            />
            <p className="text-muted-foreground text-xs">
              We&apos;ll email a reminder with the grocery list on this day.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {m.user.name ?? m.user.email}
                    {m.userId === user.id && (
                      <span className="text-muted-foreground"> (you)</span>
                    )}
                  </p>
                  <p className="text-muted-foreground truncate text-sm">
                    {m.role === "OWNER" ? "Owner" : "Member"}
                    {m.user.name && m.user.email ? ` · ${m.user.email}` : ""}
                  </p>
                </div>
                {isOwner && m.userId !== user.id && (
                  <ConfirmButton
                    action={removeMember.bind(null, household.id, m.userId)}
                    label="Remove"
                    confirmText={`Remove ${m.user.name ?? m.user.email} from ${household.name}?`}
                  />
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Leave household</CardTitle>
          <CardDescription>
            {isOwner && members.length > 1
              ? "Ownership will pass to the longest-standing member."
              : members.length === 1
                ? "You're the only member, so the household and its data will be deleted."
                : "You can rejoin later with the join code."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfirmButton
            action={leaveHousehold.bind(null, household.id)}
            label="Leave household"
            variant="destructive"
            confirmText={`Leave ${household.name}?`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
