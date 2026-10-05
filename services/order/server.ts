import { createKafka, createLogger } from "@marketplace/common";
import { OutboxRelay } from "@marketplace/outbox";
import { Partitioners } from "kafkajs";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { createDb } from "./src/@shared/infrastructure/database/db.js";

const logger = createLogger("order-service");
const { db, close } = createDb(config.DATABASE_URL);

const kafka = createKafka("order-service", config.KAFKA_BROKERS.split(","));
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
const relay = new OutboxRelay(db, producer, logger, { pollMs: config.OUTBOX_POLL_MS });

const app = buildApp({ db, logger, catalogUrl: config.CATALOG_URL });

await relay.start();
await app.listen({ port: config.PORT, host: "0.0.0.0" });

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Apagando order-service");
  await app.close();
  await relay.stop();
  await close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));