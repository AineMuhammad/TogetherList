import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local; make the Prisma CLI read it too.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

// Migrations need a direct (non-pooled) connection; Neon's pooled host has "-pooler".
const url =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL?.replace("-pooler", "") ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url },
});
