// Regenerates the README screenshots in docs/screenshots.
//
// Runs headlessly against a LOCAL, throwaway database seeded with demo data; it
// refuses to run against anything but localhost. See "Regenerating screenshots"
// in the README for the full steps.
import { chromium } from "@playwright/test";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = "docs/screenshots";

if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE_URL)) {
  throw new Error(`Refusing to seed demo data on ${BASE_URL}; use a local server.`);
}

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

const RECIPES = [
  {
    name: "Spaghetti Bolognese",
    ingredients:
      "500g minced beef\n1 onion, finely chopped\n2 cloves garlic\n1 (400g) can chopped tomatoes\n400g spaghetti\n2 tbsp olive oil",
    instructions:
      "Soften the onion and garlic in olive oil, brown the beef, add the tomatoes and simmer for 30 minutes. Serve over the spaghetti.",
  },
  {
    name: "Fluffy Pancakes",
    ingredients:
      "2 cups flour\n2 large eggs\n1 1/2 cups milk\n1 tbsp sugar\n2 tbsp butter",
    instructions:
      "Whisk the dry ingredients, then the eggs and milk. Fry ladlefuls in butter until golden on both sides.",
  },
  {
    name: "Chicken Stir Fry",
    ingredients:
      "2 chicken breasts\n1 red bell pepper\n200g broccoli\n2 tbsp soy sauce\n2 cloves garlic\n1 cup rice",
    instructions:
      "Slice and sear the chicken, add the vegetables and garlic, finish with soy sauce. Serve with rice.",
  },
  {
    name: "Greek Salad",
    ingredients: "4 tomatoes\n1 cucumber\n1 red onion\n200g feta\n1 tbsp olive oil",
    instructions:
      "Chop everything, toss with olive oil and crumble the feta over the top.",
  },
  {
    name: "Overnight Oats",
    ingredients: "1 cup oats\n1 cup milk\n1 tbsp honey\n2 bananas",
    instructions:
      "Mix oats, milk and honey in a jar and leave in the fridge overnight. Top with sliced banana.",
  },
];

// [day index (0 = Monday), slot index (0 = breakfast), recipe name]
const PLAN = [
  [0, 0, "Overnight Oats"],
  [0, 2, "Spaghetti Bolognese"],
  [1, 1, "Greek Salad"],
  [2, 0, "Fluffy Pancakes"],
  [2, 2, "Chicken Stir Fry"],
  [4, 2, "Spaghetti Bolognese"],
  [5, 0, "Fluffy Pancakes"],
];

const EXTRA_ITEMS = [
  ["Sourdough bread", ""],
  ["Greek yogurt", "2 tubs"],
  ["Dish soap", ""],
  ["Frozen peas", "1 bag"],
];

const browser = await chromium.launch();

async function newPage(viewport, { dark = false } = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: viewport.width < 600 ? 2 : 1,
    colorScheme: dark ? "dark" : "light",
  });
  if (dark) await context.addInitScript(() => localStorage.setItem("theme", "dark"));
  const page = await context.newPage();
  page.setDefaultTimeout(15_000);
  return page;
}

// ---- Seed demo data through the real UI ----
const email = `demo-${Date.now()}@example.com`;
const password = "demo-password-123";
const seed = await newPage(DESKTOP);

await seed.goto(`${BASE_URL}/sign-up`);
await seed.getByLabel("Name").fill("Alex Morgan");
await seed.getByLabel("Email").fill(email);
await seed.getByLabel("Password").fill(password);
await seed.getByRole("button", { name: "Create account" }).click();
await seed.getByLabel("Household name").fill("The Morgans");
await seed.getByRole("button", { name: "Create household" }).click();
await seed.getByRole("heading", { name: "Grocery list" }).waitFor();

for (const recipe of RECIPES) {
  await seed.goto(`${BASE_URL}/recipes/new`);
  await seed.getByLabel("Recipe name").fill(recipe.name);
  await seed.getByLabel("Ingredients").fill(recipe.ingredients);
  await seed.getByLabel("Instructions").fill(recipe.instructions);
  await seed.getByRole("button", { name: "Save recipe" }).click();
  await seed.getByRole("heading", { level: 1, name: recipe.name }).waitFor();
}

await seed.goto(`${BASE_URL}/planner`);
for (const [day, slot, name] of PLAN) {
  // Desktop grid: 3 rows x 7 days of "Add" buttons for empty slots; every add
  // changes the button list, so target by the slot's position among empty ones.
  const cell = seed.locator(`[data-slot-cell="${day}-${slot}"]`);
  await cell.getByRole("button").last().click();
  await seed
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(name) })
    .click();
  await seed.getByRole("link", { name }).first().waitFor();
}
await seed.getByRole("button", { name: "Add to grocery list" }).click();
await seed.getByRole("status").waitFor();

await seed.goto(BASE_URL);
await seed.getByRole("heading", { name: "Grocery list" }).waitFor();
for (const [name, qty] of EXTRA_ITEMS) {
  await seed.getByLabel("Item name").fill(name);
  if (qty) await seed.getByLabel("Quantity").fill(qty);
  await seed.getByRole("button", { name: "Add", exact: true }).click();
  await seed.getByText(name, { exact: true }).first().waitFor();
}
for (const name of ["Olive oil", "Spaghetti"]) {
  await seed.getByRole("checkbox", { name: `Check off ${name}` }).click();
}
await seed.getByRole("heading", { name: /Checked off/ }).waitFor();
const storageState = await seed.context().storageState();
await seed.context().close();

// ---- Capture ----
async function shoot(name, path, viewport, opts = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: viewport.width < 600 ? 2 : 1,
    colorScheme: opts.dark ? "dark" : "light",
    storageState: opts.signedOut ? undefined : storageState,
  });
  if (opts.dark) await context.addInitScript(() => localStorage.setItem("theme", "dark"));
  const page = await context.newPage();
  await page.goto(`${BASE_URL}${path}`);
  await page.getByRole("heading", { level: 1 }).first().waitFor();
  await page.waitForTimeout(800); // let fonts and the first poll settle
  if (opts.prepare) await opts.prepare(page);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: opts.fullPage ?? false });
  await context.close();
  console.log("captured", name);
}

await shoot("grocery-desktop", "/", DESKTOP);
await shoot("planner-desktop", "/planner", DESKTOP);
await shoot("recipes-desktop", "/recipes", DESKTOP);
await shoot("grocery-dark", "/", DESKTOP, { dark: true });
await shoot("grocery-mobile", "/", MOBILE);
await shoot("planner-mobile", "/planner", MOBILE);
await shoot("sign-in", "/sign-in", DESKTOP, { signedOut: true });

await browser.close();
