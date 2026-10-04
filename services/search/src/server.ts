import { createKafka, createLogger } from "@marketplace/common";
import { buildApp } from "./app.js";
import { config } from "./config.js";
import { createEsClient } from "./@shared/infrastructure/elasticsearch/client.js";
import { ProjectCatalogEventUseCase } from "./modules/products/application/use-cases/ProjectCatalogEventUseCase.js";
import { SearchProductsUseCase } from "./modules/products/application/use-cases/SearchProductsUseCase.js";
import { CatalogEventsConsumer } from "./modules/products/infrastructure/consumers/CatalogEventsConsumer.js";
import { ElasticsearchProductIndex } from "./modules/products/infrastructure/persistence/ElasticsearchProductIndex.js";

const logger = createLogger("search-service");

const es = createEsClient(config.ELASTICSEARCH_URL);
const index = new ElasticsearchProductIndex(es, config.ELASTICSEARCH_INDEX);
await index.ensureIndex();

const kafka = createKafka("search-service", config.KAFKA_BROKERS.split(","));
const consumer = new CatalogEventsConsumer(
  kafka,
  config.KAFKA_GROUP_ID,
  new ProjectCatalogEventUseCase(index),
  logger,
);

const app = buildApp({ searchProducts: new SearchProductsUseCase(index), logger });

await consumer.start();
await app.listen({ port: config.PORT, host: "0.0.0.0" });

const shutdown = async (signal: string) => {
  logger.info({ signal }, "Apagando search-service");
  await app.close();
  await consumer.stop();
  await es.close();
  process.exit(0);
};
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));