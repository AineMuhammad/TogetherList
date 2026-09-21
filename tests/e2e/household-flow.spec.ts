import { expect, test } from "@playwright/test";

// One end-to-end journey through the core of the app, sharing a single signed-in
// user: household -> grocery list -> recipe -> meal plan -> generated grocery items.
test("plan a week of meals and generate the grocery list", async ({ page }) => {
  const email = `e2e-${Date.now()}@example.com`;

  await test.step("sign up and create a household", async () => {
    await page.goto("/sign-up");
    await page.getByLabel("Name").fill("E2E Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("correct-horse-battery");
    await page.getByRole("button", { name: "Create account" }).click();

    // A brand-new user has no household yet, so onboarding comes first.
    await expect(page).toHaveURL(/\/onboarding/);
    await page.getByLabel("Household name").fill("E2E Home");
    await page.getByRole("button", { name: "Create household" }).click();

    await expect(page.getByRole("heading", { name: "Grocery list" })).toBeVisible();
  });

  await test.step("add grocery items, which are sorted into categories", async () => {
    const add = async (name: string) => {
      await page.getByLabel("Item name").fill(name);
      await page.getByRole("button", { name: "Add", exact: true }).click();
    };
    await add("milk");
    await add("bananas");

    await expect(page.getByRole("region", { name: "Dairy & eggs" })).toContainText(
      "milk",
    );
    await expect(page.getByRole("region", { name: "Produce" })).toContainText("bananas");
  });

  await test.step("check an item off", async () => {
    await page.getByRole("checkbox", { name: "Check off milk" }).click();

    await expect(page.getByRole("heading", { name: "Checked off (1)" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Checked off" })).toContainText("milk");
    // The unchecked Dairy group is gone, but bananas are untouched.
    await expect(page.getByRole("region", { name: "Dairy & eggs" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Produce" })).toContainText("bananas");
  });

  await test.step("create a recipe", async () => {
    await page.goto("/recipes/new");
    await page.getByLabel("Recipe name").fill("Pancakes");
    await page
      .getByLabel("Ingredients")
      .fill("2 cups flour\n2 large eggs\n1 1/2 cups milk");
    await page.getByRole("button", { name: "Save recipe" }).click();

    await expect(page.getByRole("heading", { level: 1, name: "Pancakes" })).toBeVisible();
    await expect(page.getByText("2 cups flour")).toBeVisible();
  });

  await test.step("plan the recipe into this week", async () => {
    await page.goto("/planner");
    // The first "Add" is the first day's breakfast slot of the current week.
    await page.getByRole("button", { name: "Add", exact: true }).first().click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /Pancakes/ })
      .click();

    // The link only appears once the server has confirmed the entry.
    await expect(page.getByRole("link", { name: "Pancakes" })).toBeVisible();
  });

  await test.step("generate the grocery list from the meal plan", async () => {
    await page.getByRole("button", { name: "Add to grocery list" }).click();
    // Flour and eggs are new; milk was checked off earlier, so it is needed again.
    await expect(page.getByRole("status")).toContainText("Added 3 new items");

    await page.getByRole("link", { name: "View grocery list" }).click();
    await expect(page.getByRole("heading", { name: "Grocery list" })).toBeVisible();
    await expect(page.getByText("Flour", { exact: true })).toBeVisible();
    await expect(page.getByText("Eggs", { exact: true })).toBeVisible();
    await expect(page.getByText("2 cups", { exact: true }).first()).toBeVisible();
  });

  await test.step("generating again does not duplicate anything", async () => {
    await page.goto("/planner");
    await page.getByRole("button", { name: "Add to grocery list" }).click();
    await expect(page.getByRole("status")).toContainText(
      "Your list already covers this week",
    );

    await page.goto("/");
    await expect(page.getByText("Flour", { exact: true })).toHaveCount(1);
  });
});
