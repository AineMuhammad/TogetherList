// Parsing and merging free-text ingredient lines ("2 cups flour", "500g minced beef")
// into a deduplicated shopping list. Pure functions, no I/O.

export type ParsedIngredient = {
  /** Cleaned display name, e.g. "minced beef". */
  name: string;
  /** Normalised key used to match the same ingredient across lines. */
  key: string;
  quantity: number | null;
  /** Canonical unit ("g", "cup", "clove"), or null for a plain count. */
  unit: string | null;
};

export type MergedIngredient = {
  name: string;
  key: string;
  /** Combined amount for display, or null when no quantity was given. */
  quantity: string | null;
};

type Family = "mass-metric" | "mass-imperial" | "vol-metric" | "vol-us";

// Convertible units: canonical name -> [family, factor to the family's base unit].
const CONVERTIBLE: Record<string, [Family, number]> = {
  g: ["mass-metric", 1],
  kg: ["mass-metric", 1000],
  oz: ["mass-imperial", 1],
  lb: ["mass-imperial", 16],
  ml: ["vol-metric", 1],
  l: ["vol-metric", 1000],
  tsp: ["vol-us", 1],
  tbsp: ["vol-us", 3],
  cup: ["vol-us", 48],
};

// Units we recognise but don't convert; they only combine with themselves.
const COUNT_UNITS = new Set([
  "clove",
  "can",
  "tin",
  "pinch",
  "dash",
  "slice",
  "bunch",
  "pack",
  "packet",
  "jar",
  "bottle",
  "stick",
  "sprig",
  "head",
  "piece",
  "handful",
  "bag",
  "box",
  "fillet",
  "stalk",
  "rasher",
  "loaf",
  "carton",
  "tub",
  "sheet",
  "cube",
]);

const UNIT_ALIASES: Record<string, string> = {
  gram: "g",
  gramme: "g",
  gm: "g",
  grams: "g",
  grammes: "g",
  kilo: "kg",
  kilos: "kg",
  kilogram: "kg",
  kilograms: "kg",
  ounce: "oz",
  ounces: "oz",
  lbs: "lb",
  pound: "lb",
  pounds: "lb",
  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  teaspoon: "tsp",
  teaspoons: "tsp",
  tsps: "tsp",
  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsps: "tbsp",
  tbs: "tbsp",
  cups: "cup",
};

const FRACTIONS: Record<string, string> = {
  "½": "1/2",
  "¼": "1/4",
  "¾": "3/4",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅛": "1/8",
};

const NUMBER = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+`;
const LEADING_QTY = new RegExp(`^(${NUMBER})(?:\\s*(?:-|–|to)\\s*(${NUMBER}))?`);
const DESCRIPTORS = /^(?:(?:large|small|medium|big|fresh|ripe)\s+)+/;
const TRAILING_NOTES =
  /\s+(?:to taste|as needed|for (?:serving|garnish|frying|dusting)|optional)$/;

function toNumber(text: string): number {
  const parts = text.trim().split(/\s+/);
  return parts.reduce((sum, part) => {
    if (part.includes("/")) {
      const [a, b] = part.split("/").map(Number);
      return sum + (b ? a / b : 0);
    }
    return sum + Number(part);
  }, 0);
}

function canonicalUnit(token: string): string | null {
  const t = token.toLowerCase().replace(/\.$/, "");
  if (t in CONVERTIBLE || COUNT_UNITS.has(t)) return t;
  if (UNIT_ALIASES[t]) return UNIT_ALIASES[t];
  const singular = singularize(t);
  if (singular in CONVERTIBLE || COUNT_UNITS.has(singular)) return singular;
  return UNIT_ALIASES[singular] ?? null;
}

function singularize(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (/(?:oes|ches|shes|sses|xes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !/(?:ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

/** Normalised matching key: lowercase, no extra words, last word singular. */
function makeKey(name: string): string {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  words[words.length - 1] = singularize(words[words.length - 1]);
  return words.join(" ");
}

/** Parses one ingredient line, or returns null if there's no usable name. */
export function parseIngredient(line: string): ParsedIngredient | null {
  let text = line.toLowerCase();
  for (const [glyph, replacement] of Object.entries(FRACTIONS)) {
    text = text.replaceAll(glyph, ` ${replacement}`);
  }
  text = text
    .replace(/\([^)]*\)/g, " ") // "(400g)" asides
    .split(",")[0] // "onion, finely chopped" -> "onion"
    .replace(/\s+/g, " ")
    .trim();
  text = text.replace(TRAILING_NOTES, "").trim();

  let quantity: number | null = null;
  let unit: string | null = null;

  const qty = LEADING_QTY.exec(text);
  if (qty) {
    // A range like "2-3" means buy enough for the higher amount.
    quantity = toNumber(qty[2] ?? qty[1]);
    text = text.slice(qty[0].length).trim();
  } else if (/^an? /.test(text)) {
    quantity = 1;
    text = text.replace(/^an? /, "");
  }

  const [first, ...rest] = text.split(" ");
  const maybeUnit = first ? canonicalUnit(first) : null;
  if (maybeUnit && rest.length > 0) {
    unit = maybeUnit;
    text = rest.join(" ").replace(/^of /, "");
  }
  if (quantity === null && unit) quantity = 1; // "a pinch of salt"

  const name = text.replace(DESCRIPTORS, "").replace(/^of /, "").trim();
  const key = makeKey(name);
  if (!key) return null;
  return { name, key, quantity, unit };
}

/** Matching key for an existing grocery item name such as "Fresh basil". */
export function ingredientKey(name: string): string {
  return parseIngredient(name)?.key ?? makeKey(name);
}

// ---- Formatting ----

function formatNumber(n: number): string {
  const whole = Math.floor(n + 1e-9);
  const frac = n - whole;
  const snaps: [number, string][] = [
    [0.25, "1/4"],
    [1 / 3, "1/3"],
    [0.5, "1/2"],
    [2 / 3, "2/3"],
    [0.75, "3/4"],
  ];
  if (frac < 0.02) return String(whole);
  if (frac > 0.98) return String(whole + 1);
  for (const [value, text] of snaps) {
    if (Math.abs(frac - value) < 0.02) return whole ? `${whole} ${text}` : text;
  }
  return String(Math.round(n * 100) / 100);
}

function plural(unit: string, n: number): string {
  if (n <= 1) return unit;
  return /(?:ch|sh)$/.test(unit) ? `${unit}es` : `${unit}s`;
}

function formatBucket(bucket: Bucket): string {
  const { kind, total } = bucket;
  switch (kind) {
    case "count":
      return formatNumber(total);
    case "mass-metric":
      return total >= 1000
        ? `${formatNumber(total / 1000)} kg`
        : `${formatNumber(total)} g`;
    case "vol-metric":
      return total >= 1000
        ? `${formatNumber(total / 1000)} l`
        : `${formatNumber(total)} ml`;
    case "mass-imperial":
      return total >= 16 ? `${formatNumber(total / 16)} lb` : `${formatNumber(total)} oz`;
    case "vol-us": {
      const cups = total / 48;
      if (total >= 12 && Math.abs(cups * 4 - Math.round(cups * 4)) < 0.05)
        return `${formatNumber(cups)} cup${cups > 1 ? "s" : ""}`;
      const tbsp = total / 3;
      if (total >= 3 && Math.abs(tbsp * 2 - Math.round(tbsp * 2)) < 0.05)
        return `${formatNumber(tbsp)} tbsp`;
      return `${formatNumber(total)} tsp`;
    }
    default:
      return `${formatNumber(total)} ${plural(bucket.unit, total)}`;
  }
}

// ---- Merging ----

type Bucket = { kind: Family | "count" | "unit"; unit: string; total: number };
type Group = { name: string; buckets: Map<string, Bucket> };

/** Adds an amount to a group, bucketed so only compatible units are summed. */
function addAmount(group: Group, quantity: number, unit: string | null) {
  let id: string;
  let kind: Bucket["kind"];
  let amount = quantity;
  const bucketUnit = unit ?? "";
  if (unit === null) {
    id = "count";
    kind = "count";
  } else if (unit in CONVERTIBLE) {
    const [family, factor] = CONVERTIBLE[unit];
    id = family;
    kind = family;
    amount *= factor;
  } else {
    id = `unit:${unit}`;
    kind = "unit";
  }
  const bucket = group.buckets.get(id) ?? { kind, unit: bucketUnit, total: 0 };
  bucket.total += amount;
  group.buckets.set(id, bucket);
}

function collect(lines: string[]): Map<string, Group> {
  const groups = new Map<string, Group>();
  for (const line of lines) {
    const parsed = parseIngredient(line);
    if (!parsed) continue;
    let group = groups.get(parsed.key);
    if (!group) {
      group = { name: parsed.name, buckets: new Map() };
      groups.set(parsed.key, group);
    }
    if (parsed.quantity !== null) addAmount(group, parsed.quantity, parsed.unit);
  }
  return groups;
}

function display(key: string, name: string, buckets: Bucket[]): MergedIngredient {
  const text = buckets.map(formatBucket).join(" + ");
  return {
    key,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    quantity: text ? text.slice(0, 40) : null,
  };
}

/**
 * Combines ingredient lines that refer to the same thing. Amounts in the same
 * unit family are summed ("200g" + "0.3kg" -> "500 g"); amounts that can't be
 * added ("200g flour" + "1 cup flour") are listed side by side.
 */
export function mergeIngredients(lines: string[]): MergedIngredient[] {
  return [...collect(lines).entries()].map(([key, g]) =>
    display(key, g.name, [...g.buckets.values()]),
  );
}

/** Parses a bare amount such as "2 cups", "500 g" or "1 1/2"; null if it isn't one. */
function parseAmount(text: string): { quantity: number; unit: string | null } | null {
  let t = text.toLowerCase();
  for (const [glyph, replacement] of Object.entries(FRACTIONS))
    t = t.replaceAll(glyph, ` ${replacement}`);
  t = t.replace(/\s+/g, " ").trim();
  const qty = LEADING_QTY.exec(t);
  if (!qty) return null;
  const rest = t.slice(qty[0].length).trim();
  const quantity = toNumber(qty[2] ?? qty[1]);
  if (!rest) return { quantity, unit: null };
  const unit = canonicalUnit(rest);
  return unit ? { quantity, unit } : null;
}

export type ExistingItem = { id: string; name: string; quantity: string | null };
export type QuantityUpdate = { id: string; name: string; quantity: string };

const EPSILON = 1e-6;

/**
 * Works out how to bring the (unchecked) grocery list up to what the recipes
 * need, without ever creating a second row for something already listed:
 *  - not on the list            -> `toAdd` a new row
 *  - listed, amount too small   -> `toUpdate` raises that row's quantity
 *  - listed, already enough     -> `skipped`
 * An existing item with no readable amount (a hand-typed "Onion") is treated as
 * covering the ingredient and left alone, since there's nothing to add to.
 */
export function planGroceryChanges(
  lines: string[],
  existing: ExistingItem[],
): { toAdd: MergedIngredient[]; toUpdate: QuantityUpdate[]; skipped: string[] } {
  const needed = collect(lines);

  type Listed = Group & {
    target?: { id: string; name: string; buckets: Map<string, Bucket> };
  };
  const onList = new Map<string, Listed>();
  for (const item of existing) {
    const key = ingredientKey(item.name);
    if (!key) continue;
    const listed: Listed = onList.get(key) ?? { name: item.name, buckets: new Map() };
    const own: Group = { name: item.name, buckets: new Map() };
    for (const part of (item.quantity ?? "").split("+")) {
      const amount = parseAmount(part);
      if (amount) addAmount(own, amount.quantity, amount.unit);
    }
    for (const [id, bucket] of own.buckets) {
      const total = listed.buckets.get(id);
      if (total) total.total += bucket.total;
      else listed.buckets.set(id, { ...bucket });
    }
    // The first row with a real amount is the one we grow.
    if (!listed.target && own.buckets.size > 0) {
      listed.target = { id: item.id, name: item.name, buckets: own.buckets };
    }
    onList.set(key, listed);
  }

  const toAdd: MergedIngredient[] = [];
  const toUpdate: QuantityUpdate[] = [];
  const skipped: string[] = [];

  for (const [key, group] of needed) {
    const listed = onList.get(key);
    const label = group.name.charAt(0).toUpperCase() + group.name.slice(1);
    if (!listed) {
      toAdd.push(display(key, group.name, [...group.buckets.values()]));
      continue;
    }
    if (!listed.target || group.buckets.size === 0) {
      skipped.push(label);
      continue;
    }

    // Grow the target row by whatever the whole list is still short of.
    const grown = new Map([...listed.target.buckets].map(([id, b]) => [id, { ...b }]));
    let changed = false;
    for (const [id, bucket] of group.buckets) {
      const remaining = bucket.total - (listed.buckets.get(id)?.total ?? 0);
      if (remaining <= EPSILON) continue;
      const current = grown.get(id);
      if (current) current.total += remaining;
      else grown.set(id, { ...bucket, total: remaining });
      changed = true;
    }
    if (!changed) {
      skipped.push(label);
      continue;
    }
    const text = [...grown.values()].map(formatBucket).join(" + ").slice(0, 40);
    toUpdate.push({ id: listed.target.id, name: label, quantity: text });
  }
  return { toAdd, toUpdate, skipped };
}
