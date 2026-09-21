import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

// The e2e suite always talks to a throwaway local database, never whatever
// DATABASE_URL happens to be in your shell or .env.local.
const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/togetherlist_e2e";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      // A desktop-sized viewport so the planner renders its 7-day grid.
      use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } },
    },
  ],
  // Serves the production build; run `npm run build` first.
  webServer: {
    command: `npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}/sign-in`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      AUTH_SECRET: "e2e-only-secret-not-for-production",
      AUTH_TRUST_HOST: "true",
      // Pin the URL so a NEXTAUTH_URL in a developer's .env.local can't redirect elsewhere.
      NEXTAUTH_URL: `http://localhost:${PORT}`,
      AUTH_URL: `http://localhost:${PORT}`,
      GOOGLE_CLIENT_ID: "",
      GOOGLE_CLIENT_SECRET: "",
    },
  },
});
