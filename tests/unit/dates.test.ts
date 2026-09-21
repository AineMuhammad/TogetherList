import {
  addDays,
  formatWeekRange,
  parseDateString,
  startOfWeek,
  weekDates,
} from "@/lib/dates";

describe("startOfWeek", () => {
  it("returns the Monday of the week", () => {
    expect(startOfWeek("2026-09-21")).toBe("2026-09-21"); // Monday
    expect(startOfWeek("2026-09-23")).toBe("2026-09-21"); // Wednesday
    expect(startOfWeek("2026-09-27")).toBe("2026-09-21"); // Sunday belongs to the week before Monday
    expect(startOfWeek("2026-09-28")).toBe("2026-09-28"); // next Monday
  });

  it("crosses year boundaries", () => {
    expect(startOfWeek("2026-01-01")).toBe("2025-12-29");
  });
});

describe("weekDates", () => {
  it("lists seven consecutive days from Monday", () => {
    expect(weekDates("2026-09-21")).toEqual([
      "2026-09-21",
      "2026-09-22",
      "2026-09-23",
      "2026-09-24",
      "2026-09-25",
      "2026-09-26",
      "2026-09-27",
    ]);
  });
});

describe("addDays", () => {
  it("handles month ends, leap days and DST changes", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2028-02-28", 1)).toBe("2028-02-29");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-09-21", -7)).toBe("2026-09-14");
  });
});

describe("parseDateString", () => {
  it("accepts real calendar dates", () => {
    expect(parseDateString("2026-09-21")?.toISOString()).toBe("2026-09-21T00:00:00.000Z");
  });

  it("rejects malformed or impossible dates", () => {
    expect(parseDateString("2026-02-30")).toBeNull();
    expect(parseDateString("2026-13-01")).toBeNull();
    expect(parseDateString("21/09/2026")).toBeNull();
    expect(parseDateString("nope")).toBeNull();
    expect(parseDateString("")).toBeNull();
  });
});

describe("formatWeekRange", () => {
  it("formats a week within one year", () => {
    expect(formatWeekRange("2026-09-21")).toBe("Sep 21 – Sep 27, 2026");
  });

  it("shows both years when a week spans New Year", () => {
    expect(formatWeekRange("2025-12-29")).toBe("Dec 29, 2025 – Jan 4, 2026");
  });
});
