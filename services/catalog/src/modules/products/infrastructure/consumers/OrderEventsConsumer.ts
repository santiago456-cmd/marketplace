import type { Logger } from "@marketplace/common";
import { type OrderCancelledEvent, type OrderCreatedEvent, TOPICS, orderEventSchema } from "@marketplace/contracts";
import type { Consumer, Kafka } from "kafkajs";
import type { ReleaseStockUseCase } from "../../application/use-cases/ReleaseStockUseCase.js";
import type { ReserveStockUseCase } from "../../application/use-cases/ReserveStockUseCase.js";

export class OrderEventsConsumer {
  private readonly consumer: Consumer;

  constructor(
    kafka: Kafka,
    groupId: string,
    private readonly reserveStock: ReserveStockUseCase,
    private readonly releaseStock: ReleaseStockUseCase,
    private readonly logger: Logger,
  ) {
    this.consumer = kafka.consumer({ groupId });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: TOPICS.ORDERS_LIFECYCLE, fromBeginning: true });
    await this.consumer.run({
      eachMessage: async ({ message, partition, topic }) => {
        const offset = message.offset;
        let event: OrderCreatedEvent | OrderCancelledEvent;
        try {
          const raw = JSON.parse(message.value?.toString() ?? "");
          // Catalog solo reacciona a estos dos; el resto de eventos de la orden no le interesan.
          if (raw?.type !== "OrderCreated" && raw?.type !== "OrderCancelled") return;
          const parsed = orderEventSchema.parse(raw);
          if (parsed.type !== "OrderCreated" && parsed.type !== "OrderCancelled") return;
          event = parsed;
        } catch (err) {
          // No cumple el contrato: reintentar no lo arregla. Se descarta y se loguea.
          this.logger.error({ err, topic, partition, offset }, "Evento inválido descartado");
          return;
        }

        // Si algo falla (p. ej. base caída) el error se propaga: kafkajs reintenta y el offset no avanza.
        switch (event.type) {
          case "OrderCreated": {
            const outcome = await this.reserveStock.execute(event);
            this.logger.info(
              { orderId: event.payload.orderId, outcome: outcome ?? "DUPLICATE", partition, offset },
              "OrderCreated procesado",
            );
            break;
          }
          case "OrderCancelled": {
            const outcome = await this.releaseStock.execute(event);
            this.logger.info({ orderId: event.payload.orderId, outcome, partition, offset }, "OrderCancelled procesado");
            break;
          }
        }
      },
    });
    this.logger.info("Consumer de orders.lifecycle iniciado");
  }

  stop(): Promise<void> {
    return this.consumer.disconnect();
  }
}