import { loadConfig } from "@marketplace/common";
import { z } from "zod";

export const config = loadConfig({
  PORT: z.coerce.number().default(3004),
  DATABASE_URL: z.string().url(),
  KAFKA_BROKERS: z.string().default("localhost:9094"),
  OUTBOX_POLL_MS: z.coerce.number().default(500),
  CATALOG_URL: z.string().url().default("http://localhost:3001"),
});