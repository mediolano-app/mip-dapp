import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env["POSTGRES_CONNECTION_STRING"] ?? "memory://mipIndexer",
  },
} satisfies Config;
