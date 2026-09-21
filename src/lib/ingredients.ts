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

/**
 * Combines ingredient lines that refer to the same thing. Amounts in the same
 * unit family are summed ("200g" + "0.3kg" -> "500 g"); amounts that can't be
 * added ("200g flour" + "1 cup flour") are listed side by side.
 */
export function mergeIngredients(lines: string[]): MergedIngredient[] {
  const groups = new Map<string, { name: string; buckets: Map<string, Bucket> }>();

  for (const line of lines) {
    const parsed = parseIngredient(line);
    if (!parsed) continue;

    let group = groups.get(parsed.key);
    if (!group) {
      group = { name: parsed.name, buckets: new Map() };
      groups.set(parsed.key, group);
    }
    if (parsed.quantity === null) continue;

    let id: string;
    let bucket: Bucket;
    let amount = parsed.quantity;
    if (parsed.unit === null) {
      id = "count";
      bucket = group.buckets.get(id) ?? { kind: "count", unit: "", total: 0 };
    } else if (parsed.unit in CONVERTIBLE) {
      const [family, factor] = CONVERTIBLE[parsed.unit];
      id = family;
      amount *= factor;
      bucket = group.buckets.get(id) ?? { kind: family, unit: parsed.unit, total: 0 };
    } else {
      id = `unit:${parsed.unit}`;
      bucket = group.buckets.get(id) ?? { kind: "unit", unit: parsed.unit, total: 0 };
    }
    bucket.total += amount;
    group.buckets.set(id, bucket);
  }

  return [...groups.entries()].map(([key, { name, buckets }]) => {
    const text = [...buckets.values()].map(formatBucket).join(" + ");
    return {
      key,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: text ? text.slice(0, 40) : null,
    };
  });
}
