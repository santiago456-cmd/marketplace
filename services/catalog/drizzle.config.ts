import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/modules/products/infrastructure/persistence/products.schema.ts",
    "./src/@shared/infrastructure/outbox/outbox.schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://catalog:catalog@localhost:5434/catalog",
  },
});