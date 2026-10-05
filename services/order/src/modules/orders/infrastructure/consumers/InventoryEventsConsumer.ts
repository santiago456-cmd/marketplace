import { ConflictException, DomainException, type Logger } from "@marketplace/common";
import { type InventoryEvent, TOPICS, parseInventoryEvent } from "@marketplace/contracts";
import type { Consumer, Kafka } from "kafkajs";
import type { HandleInventoryEventUseCase } from "../../application/use-cases/HandleInventoryEventUseCase.js";

export class InventoryEventsConsumer {
  private readonly consumer: Consumer;

  constructor(
    kafka: Kafka,
    groupId: string,
    private readonly handler: HandleInventoryEventUseCase,
    private readonly logger: Logger,
  ) {
    this.consumer = kafka.consumer({ groupId });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPICS.CATALOG_INVENTORY, fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message, partition, topic }) => {
        const offset = message.offset;
        let event: InventoryEvent;
        try {
          event = parseInventoryEvent(JSON.parse(message.value?.toString() ?? ""));
        } catch (err) {
          this.logger.error({ err, topic, partition, offset }, "Evento inválido descartado");
          return;
        }

        try {
          await this.handler.execute(event);
          this.logger.info({ type: event.type, orderId: event.payload.orderId, partition, offset }, "Evento aplicado");
        } catch (err) {
          // Un conflicto de versión sí se arregla reintentando; el resto de errores de dominio no.
          if (err instanceof DomainException && !(err instanceof ConflictException)) {
            this.logger.warn({ err, type: event.type, orderId: event.payload.orderId }, "Evento no aplicable, descartado");
            return;
          }
          throw err; // error de infraestructura: kafkajs reintenta
        }
      },
    });
    this.logger.info("Consumer de catalog.inventory iniciado");
  }

  stop(): Promise<void> {
    return this.consumer.disconnect();
  }
}