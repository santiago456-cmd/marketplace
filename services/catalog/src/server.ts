import { createKafka, createLogger } from "@marketplace/common";
import { OutboxRelay } from "@marketplace/outbox";
import { Partitioners } from "kafkajs";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { createDb } from "./@shared/infrastructure/database/db.js";
import { ReserveStockUseCase } from "./modules/products/application/use-cases/ReserveStockUseCase.js";
import { OrderEventsConsumer } from "./modules/products/infrastructure/consumers/OrderEventsConsumer.js";
import { DrizzleStockReservationRepository } from "./modules/products/infrastructure/persistence/DrizzleStockReservationRepository.js";
import { ReleaseStockUseCase } from "./modules/products/application/use-cases/ReleaseStockUseCase.js";

const logger = createLogger("catalog-service");
const { db, close } = createDb(config.DATABASE_URL);

const kafka = createKafka("catalog-service", config.KAFKA_BROKERS.split(","));
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
const relay = new OutboxRelay(db, producer, logger, { pollMs: config.OUTBOX_POLL_MS });

const reservations = new DrizzleStockReservationRepository(db);
const consumer = new OrderEventsConsumer(
  kafka,
  config.KAFKA_GROUP_ID,
  new ReserveStockUseCase(reservations),
  new ReleaseStockUseCase(reservations),
  logger,
);

const app = buildApp({ db, logger });

await relay.start();
await consumer.start();
await app.listen({ port: config.PORT, host: "0.0.0.0" });

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Apagando catalog-service");
  await app.close();
  await consumer.stop();
  await relay.stop();
  await close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));