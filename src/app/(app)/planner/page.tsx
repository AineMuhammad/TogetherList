import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { requireActiveMembership } from "@/lib/household";
import {
  addDays,
  formatWeekRange,
  parseDateString,
  startOfWeek,
  todayUtc,
  toDateString,
  weekDates,
} from "@/lib/dates";
import { PageHeader } from "@/components/layout/page-header";
import { PlannerBoard } from "@/components/planner/planner-board";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Meal planner" };

export default async function PlannerPage({ searchParams }: PageProps<"/planner">) {
  const { active } = await requireActiveMembership();
  const { week } = await searchParams;

  const requested = typeof week === "string" && parseDateString(week) ? week : todayUtc();
  const weekStart = startOfWeek(requested);
  const days = weekDates(weekStart);
  const thisWeek = startOfWeek(todayUtc());

  const [entries, recipes] = await Promise.all([
    db.mealPlanEntry.findMany({
      where: {
        householdId: active.householdId,
        date: { gte: parseDateString(days[0])!, lte: parseDateString(days[6])! },
      },
      include: { recipe: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.recipe.findMany({
      where: { householdId: active.householdId },
      select: { id: true, name: true, ingredients: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Meal planner"
        description={`Plan the week's meals for ${active.household.name}.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Previous week"
              nativeButton={false}
              render={<Link href={`/planner?week=${addDays(weekStart, -7)}`} />}
            >
              <ChevronLeft />
            </Button>
            <span className="min-w-36 text-center text-sm font-bold sm:min-w-44">
              {formatWeekRange(weekStart)}
            </span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Next week"
              nativeButton={false}
              render={<Link href={`/planner?week=${addDays(weekStart, 7)}`} />}
            >
              <ChevronRight />
            </Button>
            {weekStart !== thisWeek && (
              <Button
                variant="ghost"
                nativeButton={false}
                render={<Link href="/planner" />}
              >
                This week
              </Button>
            )}
          </div>
        }
      />
      <PlannerBoard
        key={weekStart}
        days={days}
        entries={entries.map((e) => ({
          id: e.id,
          date: toDateString(e.date),
          slot: e.mealSlot,
          recipeId: e.recipeId,
          recipeName: e.recipe.name,
        }))}
        recipes={recipes.map((r) => ({
          id: r.id,
          name: r.name,
          ingredientCount: r.ingredients.length,
        }))}
      />
    </div>
  );
}
