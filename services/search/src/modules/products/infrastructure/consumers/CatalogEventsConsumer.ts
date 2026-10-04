import { TOPICS, parseCatalogEvent } from "@marketplace/contracts";
import type { Consumer, Kafka } from "kafkajs";
import type { Logger } from "../../../../@shared/infrastructure/logger.js";
import type { ProjectCatalogEventUseCase } from "../../application/use-cases/ProjectCatalogEventUseCase.js";

export class CatalogEventsConsumer {
  private readonly consumer: Consumer;

  constructor(
    kafka: Kafka,
    groupId: string,
    private readonly projector: ProjectCatalogEventUseCase,
    private readonly logger: Logger,
  ) {
    this.consumer = kafka.consumer({ groupId });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPICS.CATALOG_PRODUCTS, fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message, partition, topic }) => {
        const offset = message.offset;
        let event;
        try {
          event = parseCatalogEvent(JSON.parse(message.value?.toString() ?? ""));
        } catch (err) {
          // Mensaje que no cumple el contrato: reintentar no lo arregla. Se descarta y se loguea.
          // (Más adelante: enviarlo a un tópico DLQ.)
          this.logger.error({ err, topic, partition, offset }, "Evento inválido descartado");
          return;
        }

        // Si esto falla (p. ej. ES caído) el error se propaga: kafkajs reintenta, no avanza el offset.
        await this.projector.execute(event);
        this.logger.info({ type: event.type, aggregateId: event.aggregateId, partition, offset }, "Evento proyectado");
      },
    });
    this.logger.info("Consumer de catalog.products iniciado");
  }

  stop(): Promise<void> {
    return this.consumer.disconnect();
  }
}