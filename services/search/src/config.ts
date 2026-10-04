import { loadConfig } from "@marketplace/common";
import { z } from "zod";

export const config = loadConfig({
  PORT: z.coerce.number().default(3002),
  ELASTICSEARCH_URL: z.string().url().default("http://localhost:9200"),
  ELASTICSEARCH_INDEX: z.string().default("products-v1"),
  KAFKA_BROKERS: z.string().default("localhost:9094"),
  KAFKA_GROUP_ID: z.string().default("search-service"),
});