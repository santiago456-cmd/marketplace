import { createLogger } from "@marketplace/common";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { createDb } from "./@shared/infrastructure/database/db.js";

const logger = createLogger("identity-service");
const { db, close } = createDb(config.DATABASE_URL);

const app = buildApp({
  db,
  logger,
  jwt: { secret: config.JWT_SECRET, ttlSeconds: config.JWT_TTL_SECONDS },
});

await app.listen({ port: config.PORT, host: "0.0.0.0" });

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Apagando identity-service");
  await app.close();
  await close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));