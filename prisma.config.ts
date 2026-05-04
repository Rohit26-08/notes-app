import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local for local dev; on Vercel these come from the platform
config({ path: ".env.local", override: false });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL_UNPOOLED"] ?? process.env["DATABASE_URL"],
  },
});
