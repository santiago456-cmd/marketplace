/// <reference types="node" />
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./src/modules/orders/infrastructure/persistence/order-events.schema.ts",
    "../../packages/outbox/src/outbox.schema.ts",
  ],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://orders:orders@localhost:5435/orders",
  },
});