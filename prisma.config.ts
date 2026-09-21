import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local; make the Prisma CLI read it too.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
