import { createLogger } from "@marketplace/common";
import { buildApp } from "./app.js";
import { config } from "./config.js";

const logger = createLogger("gateway");

const app = buildApp({
  logger,
  jwtSecret: config.JWT_SECRET,
  upstreams: {
    identity: config.IDENTITY_URL,
    catalog: config.CATALOG_URL,
    search: config.SEARCH_URL,
    order: config.ORDER_URL,
  },
});

await app.listen({ port: config.PORT, host: "0.0.0.0" });

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Apagando gateway");
  await app.close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
