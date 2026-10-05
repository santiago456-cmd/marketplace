import { loadConfig } from "@marketplace/common";
import { z } from "zod";

export const config = loadConfig({
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(32),
  IDENTITY_URL: z.string().url().default("http://localhost:3003"),
  CATALOG_URL: z.string().url().default("http://localhost:3001"),
  SEARCH_URL: z.string().url().default("http://localhost:3002"),
  ORDER_URL: z.string().url().default("http://localhost:3004"),
});
