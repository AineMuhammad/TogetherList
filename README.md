# TogetherList

[![CI](https://github.com/AineMuhammad/TogetherList/actions/workflows/ci.yml/badge.svg)](https://github.com/AineMuhammad/TogetherList/actions/workflows/ci.yml)

A shared grocery list and weekly meal planner for a household. Everyone in the household sees the same list, checking something off on one phone updates everyone else's within seconds, and planning the week's meals can build the shopping list for you.

**Live app: https://togetherlist-one.vercel.app**

## Screenshots

![The shared grocery list, grouped by category](docs/screenshots/grocery-desktop.png)

![The weekly meal planner](docs/screenshots/planner-desktop.png)

<p>
  <img src="docs/screenshots/grocery-mobile.png" alt="Grocery list on a phone" width="260">
  <img src="docs/screenshots/planner-mobile.png" alt="Meal planner on a phone" width="260">
</p>

<details>
<summary>More: recipe library, dark mode and sign-in</summary>

![Recipe library](docs/screenshots/recipes-desktop.png)

![Dark mode](docs/screenshots/grocery-dark.png)

![Sign-in](docs/screenshots/sign-in.png)

</details>

## Features

- **Accounts:** sign up and sign in with email and password, or with Google. Every page and API route requires a signed-in user.
- **Households:** create a household or join one with a 6-character join code. A user can belong to several households and switch between them from the top bar. Owners can rename the household, choose its shopping day and remove members; anyone can leave (ownership passes on if the owner leaves).
- **Shared grocery list:** add items with an optional quantity. The category (Produce, Dairy & eggs, Meat & fish, Pantry, Frozen, Household, Other) is guessed from the name, and you can override it when adding or move an item later. The list is grouped by category, and checked items drop into a "Checked off" section.
- **Live sync:** the list is polled every ~3 seconds, so changes from other devices appear without a refresh. Local actions (check, add, remove, re-categorise) update instantly and roll back with an error message if the server rejects them.
- **Recipe library:** add recipes by hand (name, one ingredient per line, optional instructions), edit and delete them, and search the library. Recipes are per household; there is no external recipe API.
- **Weekly meal planner:** a Monday-to-Sunday view of breakfast, lunch and dinner. Assign one or more recipes from the library to any slot and step between weeks.
- **Grocery list from the meal plan:** one button merges the ingredient lines of every planned meal, combining matching ingredients and adding up their quantities. Ingredients already on the list are not duplicated: the existing row's quantity is raised instead (see [Ingredient merging](#ingredient-merging)).
- **Responsive design and dark mode:** mobile-first layout with a bottom tab bar on phones and a wide multi-column layout on large screens. Light, dark or system theme from the account menu.

### Not implemented yet

- **Weekly reminder emails.** The data model stores each household's shopping day and Settings lets owners change it, but nothing sends an email yet. The planned design is a daily Vercel Cron job that emails members of households whose shopping day is today, using Resend. Because of this, `RESEND_API_KEY` is documented below but currently unused.
- Dedicated loading skeletons and richer empty/error states beyond what's already there.

## Tech stack

| Area         | Choice                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| Framework    | Next.js 16 (App Router), React 19, TypeScript                           |
| Styling      | Tailwind CSS 4, shadcn/ui components (Base UI primitives), Manrope font |
| Database     | PostgreSQL (Neon) with Prisma 7 and the `@prisma/adapter-pg` driver     |
| Auth         | Auth.js (NextAuth v5): Google OAuth + email/password, Prisma adapter    |
| Live sync    | SWR polling, no websockets                                              |
| Validation   | Zod                                                                     |
| Tests        | Jest (unit), Playwright (headless e2e)                                  |
| CI / hosting | GitHub Actions, Vercel                                                  |

## Local setup

**Prerequisites:** Node.js 20.19+, 22.12+ or 24+ (developed on 24), npm, and a PostgreSQL database.

1. **Install dependencies**

   ```bash
   npm install
   ```

   This also runs `prisma generate` (the client is written to `src/generated`, which is git-ignored).

2. **Create a database.** Any Postgres works. The easiest hosted option is a free [Neon](https://neon.tech) project. To run one locally instead:

   ```bash
   docker run -d --name togetherlist-pg -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=togetherlist -p 5432:5432 postgres:16
   # DATABASE_URL=postgresql://postgres:postgres@localhost:5432/togetherlist
   ```

3. **Configure environment variables.** Copy the example file and fill it in (see [Environment variables](#environment-variables)):

   ```bash
   cp .env.example .env.local
   openssl rand -base64 32   # use the output for NEXTAUTH_SECRET
   ```

4. **Apply the database migrations**

   ```bash
   npx prisma migrate deploy
   ```

5. **Start the dev server** and open http://localhost:3000

   ```bash
   npm run dev
   ```

Email/password sign-up works with nothing but the database and `NEXTAUTH_SECRET`. The "Continue with Google" button only appears when both Google variables are set.

### Setting up Google sign-in (optional)

1. In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** of type _Web application_.
2. Add these **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-production-domain>/api/auth/callback/google`
3. Put the client ID and secret in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## Environment variables

| Variable               | Required   | Description                                                                                                                        |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`         | Yes        | Postgres connection string. With Neon, use the pooled connection string; migrations automatically use the direct host (see below). |
| `NEXTAUTH_SECRET`      | Yes        | Secret used to sign session tokens. Generate with `openssl rand -base64 32`. `AUTH_SECRET` is accepted as an alias.                |
| `NEXTAUTH_URL`         | Local only | Base URL of the app, e.g. `http://localhost:3000`. On Vercel it can be left unset; the URL is derived from the request.            |
| `GOOGLE_CLIENT_ID`     | Optional   | Enables Google sign-in together with the secret.                                                                                   |
| `GOOGLE_CLIENT_SECRET` | Optional   | See above.                                                                                                                         |
| `RESEND_API_KEY`       | Not used   | Reserved for the planned reminder emails. Safe to leave empty today.                                                               |

Two optional variables exist for tooling: `DIRECT_URL` overrides the connection string the Prisma CLI uses for migrations, and `E2E_DATABASE_URL` overrides the database the e2e tests use (see [Testing](#testing)).

## Scripts

| Command              | What it does                                                     |
| -------------------- | ---------------------------------------------------------------- |
| `npm run dev`        | Start the development server                                     |
| `npm run build`      | Production build                                                 |
| `npm run start`      | Serve the production build                                       |
| `npm run lint`       | ESLint                                                           |
| `npm run typecheck`  | TypeScript check (run `npx next typegen` first on a fresh clone) |
| `npm run format`     | Format with Prettier (`format:check` to verify only)             |
| `npm run test:unit`  | Jest unit tests                                                  |
| `npm run test:e2e`   | Playwright end-to-end tests (headless)                           |
| `npm run db:migrate` | Create and apply a migration during development                  |
| `npm run db:deploy`  | Apply existing migrations (production and CI)                    |
| `npm run db:studio`  | Browse the database with Prisma Studio                           |

## Testing

- **Unit tests** (`tests/unit`) cover the pure logic: the category auto-sort, ingredient parsing and merging (including the "raise the existing row" behaviour) and the week/date helpers.
- **End-to-end test** (`tests/e2e`) runs one full journey headlessly in Chromium: sign up, create a household, add grocery items, check one off, create a recipe, plan it into this week, generate the grocery list, and confirm that generating again adds no duplicates.

The e2e suite serves the production build and **always uses its own database** (default `postgresql://postgres:postgres@localhost:5432/togetherlist_e2e`, override with `E2E_DATABASE_URL`), never the `DATABASE_URL` from your environment. To run it locally:

```bash
docker run -d --name togetherlist-e2e -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=togetherlist_e2e -p 5432:5432 postgres:16
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/togetherlist_e2e npx prisma migrate deploy
npx playwright install chromium
npm run build
npm run test:e2e
```

### Regenerating screenshots

`scripts/capture-screenshots.mjs` seeds a demo household ("The Morgans") through the real UI and saves the images in `docs/screenshots`. It runs headlessly and refuses to run against anything but a local server, so point it at a throwaway database:

```bash
docker run -d --name togetherlist-shots -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=togetherlist_shots -p 5432:5432 postgres:16
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/togetherlist_shots
npx prisma migrate deploy && npm run build
AUTH_SECRET=x AUTH_TRUST_HOST=true AUTH_URL=http://localhost:3100 npm run start -- --port 3100 &
npm run docs:screenshots
```

The planner shows the current week, so re-run this whenever you want the dates refreshed.

**CI** (`.github/workflows/ci.yml`) runs on every push and pull request: one job checks formatting, lint, types and unit tests; a second starts a Postgres service, migrates it, builds the app and runs the Playwright test, uploading the report if it fails.

## Architecture notes

### Structure

```
src/
  app/
    (auth)/           sign-in and sign-up pages
    (app)/            signed-in pages: grocery, planner, recipes, settings, onboarding
    actions/          server actions (auth, household, grocery, recipes, planner)
    api/              Auth.js handler and the grocery polling endpoint
  components/         UI grouped by feature (grocery, planner, recipes, household, layout)
  hooks/use-grocery.ts  SWR polling + optimistic updates
  lib/                categorize, ingredients, dates, validation, household helpers
  proxy.ts            route protection (Next 16's rename of middleware)
prisma/               schema and migrations
tests/                unit and e2e
```

### Data model

`User`, `Account`, `Session` and `VerificationToken` are the Auth.js tables. On top of them: `Household` (name, unique join code, shopping day), `HouseholdMember` (role `OWNER`/`MEMBER`, unique per household and user), `GroceryItem`, `Recipe` (ingredients stored as a `String[]`, one line each) and `MealPlanEntry` (date, meal slot, recipe). Deleting a household or recipe cascades to its dependent rows.

### Authentication and access control

Sessions are JWTs, because the credentials provider requires them; the Prisma adapter still stores users and linked Google accounts. `proxy.ts` redirects signed-out visitors to `/sign-in`. Every server action and API route additionally verifies that the user is a member of the household it touches, and owner-only actions (rename, shopping day, remove member) check the role on the server, not just in the UI. The active household is remembered in a cookie.

### Live sync

The grocery page renders once on the server, then `useGrocery` takes over with SWR: it polls `GET /api/households/[id]/grocery` every 3 seconds (paused while the tab is hidden, refreshed on focus). Each mutation applies an optimistic change to the SWR cache, calls a server action, and then refetches; if the action fails the cache rolls back and an error banner appears. Polling was chosen over websockets or SSE for simplicity and because it fits serverless hosting.

### Category auto-sort

`src/lib/categorize.ts` is a pure function that matches whole-word keywords (tolerating plurals) against ordered rules, so specific phrases win over the general words inside them: "ice cream" is Frozen rather than Dairy, "peanut butter" and "chicken stock" are Pantry, "black pepper" is Pantry while "bell pepper" is Produce. Anything unrecognised is "Other", and users can always override the category.

### Ingredient merging

`src/lib/ingredients.ts` parses free-text lines such as `2 cups flour`, `500g minced beef`, `1 1/2 cups milk` or `1 onion, finely chopped` into a quantity, a unit and a name. Names are normalised (case, plurals, descriptors like "large" or "fresh") so `eggs`, `1 egg` and `3 large eggs` are the same ingredient. Amounts are added when their units are compatible (g/kg, oz/lb, ml/l, tsp/tbsp/cup) and listed side by side otherwise (`200 g + 1 cup`).

When generating from the meal plan, each planned meal counts, so a recipe planned twice doubles its ingredients. The result is compared with the unchecked items already on the list:

- not on the list: a new row is added;
- on the list but with too little: that row's quantity is raised (`500 g` becomes `1 kg`), never a second row;
- already enough: left alone, so pressing the button twice changes nothing;
- a hand-typed item with no readable amount (for example "Onion") counts as covering the ingredient and is left untouched.

Checked-off items don't count, so something you already bought can be needed again.

### Dates

Meal-plan dates are calendar days, not moments in time. They are passed around as `YYYY-MM-DD` strings and interpreted in UTC (`src/lib/dates.ts`), which keeps a planned Tuesday on Tuesday whatever the server or browser timezone. The planner highlights "today" using the viewer's own clock, while the default week (when none is in the URL) uses the server's UTC date, so around midnight in far-off timezones the default week can differ for a few hours; the week arrows and the "This week" button always work.

### Database migrations on Neon

The app connects through Neon's pooled host. Prisma migrations need a direct connection, so `prisma.config.ts` strips `-pooler` from the host for CLI commands (or uses `DIRECT_URL` if set).

## Deployment (Vercel)

The app is deployed at https://togetherlist-one.vercel.app.

1. **Database.** Create a Postgres database (Vercel Marketplace Neon integration, or any Postgres) and copy its connection string. Vercel Postgres itself is no longer offered; Neon via the Marketplace is the replacement.
2. **Create the project.** Import the GitHub repository in Vercel, or use the CLI: `vercel link` then `vercel deploy --prod`. Framework preset: Next.js; no custom build settings are needed (`postinstall` generates the Prisma client).
3. **Set environment variables** for Production: `DATABASE_URL`, `NEXTAUTH_SECRET` (generate a new one; don't reuse your local secret), and `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` if you want Google sign-in. `NEXTAUTH_URL` is optional on Vercel.
4. **Apply migrations** to the production database once, from your machine, and again whenever the schema changes:

   ```bash
   DATABASE_URL="<production url>" npx prisma migrate deploy
   ```

5. **Google redirect URI.** Add `https://<your-domain>/api/auth/callback/google` to the OAuth client's authorized redirect URIs, otherwise Google shows `redirect_uri_mismatch`.

Preview deployments get a different URL for every deploy, and Google does not allow wildcard redirect URIs, so Google sign-in is only reliable on the production domain. Email/password works everywhere.
