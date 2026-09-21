// Meal plan dates are calendar days, not moments, so we pass them around as
// "YYYY-MM-DD" strings and always interpret them in UTC. This keeps a planned
// Tuesday on Tuesday no matter which timezone the server or browser is in.

const MS_PER_DAY = 86_400_000;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Parses "YYYY-MM-DD" to a UTC-midnight Date, or null if it isn't a real date. */
export function parseDateString(value: string): Date | null {
  if (!DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || toDateString(date) !== value ? null : date;
}

export function addDays(value: string, days: number): string {
  const date = parseDateString(value);
  if (!date) throw new Error(`Invalid date: ${value}`);
  return toDateString(new Date(date.getTime() + days * MS_PER_DAY));
}

/** The Monday of the week containing `value`. */
export function startOfWeek(value: string): string {
  const date = parseDateString(value);
  if (!date) throw new Error(`Invalid date: ${value}`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return addDays(value, -daysSinceMonday);
}

/** The seven days (Monday first) of the week starting at `weekStart`. */
export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

/** Today according to the server clock (UTC). */
export function todayUtc(): string {
  return toDateString(new Date());
}

/** Today according to the viewer's own clock; only call in the browser. */
export function todayLocal(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function format(value: string, options: Intl.DateTimeFormatOptions) {
  const date = parseDateString(value);
  return date
    ? new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(date)
    : value;
}

export const formatWeekday = (value: string, style: "short" | "long" = "short") =>
  format(value, { weekday: style });

export const formatDayMonth = (value: string) =>
  format(value, { day: "numeric", month: "short" });

export const formatDayOfMonth = (value: string) => format(value, { day: "numeric" });

export function formatWeekRange(weekStart: string): string {
  const end = addDays(weekStart, 6);
  const startYear = weekStart.slice(0, 4);
  const endYear = end.slice(0, 4);
  const start = format(weekStart, {
    day: "numeric",
    month: "short",
    ...(startYear !== endYear ? { year: "numeric" } : {}),
  });
  const finish = format(end, { day: "numeric", month: "short", year: "numeric" });
  return `${start} – ${finish}`;
}
