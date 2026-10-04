import { randomUUID } from "node:crypto";
import {
  TOPICS,
  productCreatedEvent,
  parseCatalogEvent,
} from "@marketplace/contracts";
import { createKafka } from "./kafka.js";
import { createLogger } from "./logger.js";

const log = createLogger("smoke");
const kafka = createKafka("smoke-test");

const productId = randomUUID();
const event = productCreatedEvent.parse({
  eventId: randomUUID(),
  type: "ProductCreated",
  version: 1,
  occurredAt: new Date().toISOString(),
  aggregateId: productId,
  payload: {
    productId,
    sellerId: randomUUID(),
    name: "Bicicleta de prueba",
    description: "Evento de smoke test",
    categoryId: "deportes",
    price: { amount: 15000000, currency: "ARS" },
    stock: 1,
    condition: "USED",
    status: "DRAFT",
  },
});

const consumer = kafka.consumer({ groupId: `smoke-${randomUUID()}` });
const producer = kafka.producer();

const received = new Promise<void>((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("Timeout: el evento no llegó en 20s")), 20_000);

  consumer
    .connect()
    .then(() => consumer.subscribe({ topic: TOPICS.CATALOG_PRODUCTS, fromBeginning: true }))
    .then(() =>
      consumer.run({
        eachMessage: async ({ message }) => {
          const parsed = parseCatalogEvent(JSON.parse(message.value!.toString()));
          if (parsed.eventId === event.eventId) {
            log.info({ type: parsed.type, key: message.key?.toString() }, "Evento recibido y validado ✔");
            clearTimeout(timer);
            resolve();
          }
        },
      }),
    )
    .then(async () => {
      await producer.connect();
      await producer.send({
        topic: TOPICS.CATALOG_PRODUCTS,
        messages: [{ key: event.aggregateId, value: JSON.stringify(event) }],
      });
      log.info("Evento publicado");
    })
    .catch(reject);
});

try {
  await received;
  log.info("Smoke test OK");
} catch (err) {
  log.error(err, "Smoke test FALLÓ");
  process.exitCode = 1;
} finally {
  await producer.disconnect();
  await consumer.disconnect();
}