"use client";

import Link from "next/link";
import {
  useMemo,
  useOptimistic,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { Coffee, Plus, Salad, UtensilsCrossed, X, type LucideIcon } from "lucide-react";
import { addMealPlanEntry, removeMealPlanEntry } from "@/app/actions/planner";
import type { MealSlot } from "@/generated/prisma/enums";
import { formatDayOfMonth, formatWeekday, todayLocal } from "@/lib/dates";
import { MEAL_SLOT_LABELS, MEAL_SLOT_ORDER } from "@/lib/meals";
import { cn } from "@/lib/utils";
import { RecipePicker, type PickerRecipe } from "./recipe-picker";

export type PlanEntry = {
  id: string;
  date: string;
  slot: MealSlot;
  recipeId: string;
  recipeName: string;
  pending?: boolean;
};

type Action = { type: "add"; entry: PlanEntry } | { type: "remove"; id: string };

const SLOT_ICONS: Record<MealSlot, LucideIcon> = {
  BREAKFAST: Coffee,
  LUNCH: Salad,
  DINNER: UtensilsCrossed,
};

const noopSubscribe = () => () => {};

type Props = { days: string[]; entries: PlanEntry[]; recipes: PickerRecipe[] };

export function PlannerBoard({ days, entries, recipes }: Props) {
  const [optimistic, dispatch] = useOptimistic(
    entries,
    (state: PlanEntry[], action: Action) =>
      action.type === "add"
        ? [...state, action.entry]
        : state.filter((e) => e.id !== action.id),
  );
  const [, startTransition] = useTransition();
  const [picking, setPicking] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The viewer's local "today"; null on the server so hydration always matches.
  const today = useSyncExternalStore(noopSubscribe, todayLocal, () => null);

  const bySlot = useMemo(() => {
    const map = new Map<string, PlanEntry[]>();
    for (const e of optimistic) {
      const key = `${e.date}|${e.slot}`;
      map.set(key, [...(map.get(key) ?? []), e]);
    }
    return map;
  }, [optimistic]);

  const entriesFor = (date: string, slot: MealSlot) =>
    bySlot.get(`${date}|${slot}`) ?? [];

  function add(recipe: PickerRecipe, date: string, slot: MealSlot) {
    setError(null);
    startTransition(async () => {
      dispatch({
        type: "add",
        entry: {
          id: `temp-${crypto.randomUUID()}`,
          date,
          slot,
          recipeId: recipe.id,
          recipeName: recipe.name,
          pending: true,
        },
      });
      const result = await addMealPlanEntry(recipe.id, date, slot);
      if (result.error) setError(result.error);
    });
  }

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      dispatch({ type: "remove", id });
      const result = await removeMealPlanEntry(id);
      if (result.error) setError(result.error);
    });
  }

  const pickerEntries = picking ? entriesFor(picking.date, picking.slot) : [];
  const availableRecipes = recipes.filter(
    (r) => !pickerEntries.some((e) => e.recipeId === r.id),
  );

  const cell = (date: string, slot: MealSlot) => (
    <SlotCell
      entries={entriesFor(date, slot)}
      onAdd={() => setPicking({ date, slot })}
      onRemove={remove}
    />
  );

  return (
    <div className="space-y-4">
      {error && (
        <p
          role="alert"
          className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm font-semibold"
        >
          {error}
        </p>
      )}

      {/* Desktop: a 7-day grid with one row per meal. */}
      <div className="hidden lg:grid lg:grid-cols-[6.5rem_repeat(7,minmax(0,1fr))] lg:gap-2">
        <div />
        {days.map((date) => (
          <DayHeading key={date} date={date} isToday={date === today} />
        ))}
        {MEAL_SLOT_ORDER.map((slot) => {
          const Icon = SLOT_ICONS[slot];
          return (
            <div key={slot} className="contents">
              <div className="text-muted-foreground flex items-start gap-2 pt-3 text-sm font-bold">
                <Icon className="text-primary mt-0.5 size-4" />
                {MEAL_SLOT_LABELS[slot]}
              </div>
              {days.map((date) => (
                <div
                  key={date}
                  data-slot-cell={`${days.indexOf(date)}-${MEAL_SLOT_ORDER.indexOf(slot)}`}
                  className={cn(
                    "bg-card ring-foreground/8 min-h-28 rounded-xl p-2 ring-1",
                    date === today && "ring-primary/40 ring-2",
                  )}
                >
                  {cell(date, slot)}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Phones and tablets: one card per day. */}
      <div className="space-y-4 lg:hidden">
        {days.map((date) => (
          <section
            key={date}
            className={cn(
              "bg-card ring-foreground/8 rounded-2xl shadow-sm ring-1",
              date === today && "ring-primary/40 ring-2",
            )}
          >
            <div className="flex items-baseline gap-2 border-b px-4 py-3">
              <h2 className="text-base font-extrabold">{formatWeekday(date, "long")}</h2>
              <span className="text-muted-foreground text-sm font-medium">
                {formatDayOfMonth(date)}
              </span>
              {date === today && (
                <span className="bg-primary text-primary-foreground ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold">
                  Today
                </span>
              )}
            </div>
            <div className="divide-y">
              {MEAL_SLOT_ORDER.map((slot) => {
                const Icon = SLOT_ICONS[slot];
                return (
                  <div key={slot} className="px-4 py-3">
                    <p className="text-muted-foreground mb-2 flex items-center gap-2 text-xs font-bold tracking-wide uppercase">
                      <Icon className="text-primary size-3.5" />
                      {MEAL_SLOT_LABELS[slot]}
                    </p>
                    {cell(date, slot)}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <RecipePicker
        open={picking !== null}
        title={
          picking
            ? `${formatWeekday(picking.date, "long")} ${MEAL_SLOT_LABELS[picking.slot].toLowerCase()}`
            : ""
        }
        recipes={availableRecipes}
        libraryEmpty={recipes.length === 0}
        onClose={() => setPicking(null)}
        onPick={(recipe) => {
          if (picking) add(recipe, picking.date, picking.slot);
          setPicking(null);
        }}
      />
    </div>
  );
}

function DayHeading({ date, isToday }: { date: string; isToday: boolean }) {
  return (
    <div className="pb-1 text-center">
      <p className="text-muted-foreground text-xs font-bold tracking-wide uppercase">
        {formatWeekday(date)}
      </p>
      <p
        className={cn(
          "mx-auto mt-1 flex size-8 items-center justify-center rounded-full text-base font-extrabold",
          isToday && "bg-primary text-primary-foreground",
        )}
      >
        {formatDayOfMonth(date)}
      </p>
    </div>
  );
}

function SlotCell({
  entries,
  onAdd,
  onRemove,
}: {
  entries: PlanEntry[];
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      {entries.map((e) => (
        <div
          key={e.id}
          className={cn(
            "bg-accent text-accent-foreground flex items-center gap-1 rounded-lg py-1 pr-1 pl-2.5 text-sm font-semibold",
            e.pending && "opacity-60",
          )}
        >
          {e.pending ? (
            <span className="min-w-0 flex-1 truncate py-1">{e.recipeName}</span>
          ) : (
            <Link
              href={`/recipes/${e.recipeId}`}
              className="min-w-0 flex-1 truncate py-1 hover:underline"
            >
              {e.recipeName}
            </Link>
          )}
          <button
            type="button"
            aria-label={`Remove ${e.recipeName}`}
            disabled={e.pending}
            onClick={() => onRemove(e.id)}
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-black/10 disabled:cursor-default dark:hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          "border-input text-muted-foreground hover:border-primary hover:bg-accent/50 hover:text-accent-foreground flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed text-sm font-semibold transition-colors",
          entries.length === 0 ? "h-10" : "h-8",
        )}
      >
        <Plus className="size-4" />
        {entries.length === 0 ? "Add" : ""}
        <span className="sr-only">
          {entries.length === 0 ? "" : "Add another recipe"}
        </span>
      </button>
    </div>
  );
}
