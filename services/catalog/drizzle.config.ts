/// <reference types="node" />
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/modules/products/infrastructure/persistence/products.schema.ts",
    "./src/modules/products/infrastructure/persistence/stock-reservations.schema.ts",
    "../../packages/outbox/src/outbox.schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://catalog:catalog@localhost:5434/catalog",
  },
});