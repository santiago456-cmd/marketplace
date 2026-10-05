import { createKafka, createLogger } from "@marketplace/common";
import { OutboxRelay } from "@marketplace/outbox";
import { Partitioners } from "kafkajs";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { createDb } from "./@shared/infrastructure/database/db.js";
import { HandleInventoryEventUseCase } from "./modules/orders/application/use-cases/HandleInventoryEventUseCase.js";
import { ProcessPaymentUseCase } from "./modules/orders/application/use-cases/ProcessPaymentUseCase.js";
import { InventoryEventsConsumer } from "./modules/orders/infrastructure/consumers/InventoryEventsConsumer.js";
import { PaymentConsumer } from "./modules/orders/infrastructure/consumers/PaymentConsumer.js";
import { SimulatedPaymentGateway } from "./modules/orders/infrastructure/payment/SimulatedPaymentGateway.js";
import { DrizzleOrderRepository } from "./modules/orders/infrastructure/persistence/DrizzleOrderRepository.js";

const logger = createLogger("order-service");
const { db, close } = createDb(config.DATABASE_URL);

const kafka = createKafka("order-service", config.KAFKA_BROKERS.split(","));
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
const relay = new OutboxRelay(db, producer, logger, { pollMs: config.OUTBOX_POLL_MS });

const orders = new DrizzleOrderRepository(db);

const inventoryConsumer = new InventoryEventsConsumer(
  kafka,
  config.KAFKA_GROUP_ID,
  new HandleInventoryEventUseCase(orders),
  logger,
);

const paymentConsumer = new PaymentConsumer(
  kafka,
  `${config.KAFKA_GROUP_ID}-payments`,
  new ProcessPaymentUseCase(orders, new SimulatedPaymentGateway(config.PAYMENT_LIMIT_AMOUNT)),
  logger,
);

const app = buildApp({ db, logger, catalogUrl: config.CATALOG_URL });

await relay.start();
await inventoryConsumer.start();
await paymentConsumer.start();
await app.listen({ port: config.PORT, host: "0.0.0.0" });

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Apagando order-service");
  await app.close();
  await paymentConsumer.stop();
  await inventoryConsumer.stop();
  await relay.stop();
  await close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));