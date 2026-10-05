import { loadConfig } from "@marketplace/common";
import { z } from "zod";

export const config = loadConfig({
  PORT: z.coerce.number().default(3004),
  DATABASE_URL: z.string().url(),
  KAFKA_BROKERS: z.string().default("localhost:9094"),
  KAFKA_GROUP_ID: z.string().default("order-service"),
  OUTBOX_POLL_MS: z.coerce.number().default(500),
  CATALOG_URL: z.string().url().default("http://localhost:3001"),
  /** Límite de la pasarela simulada, en centavos: los totales mayores se rechazan. */
  PAYMENT_LIMIT_AMOUNT: z.coerce.number().int().positive().default(50_000_000),
});