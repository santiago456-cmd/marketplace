import { loadConfig } from "@marketplace/common";
import { z } from "zod";

export const config = loadConfig({
  PORT: z.coerce.number().default(3003),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
});