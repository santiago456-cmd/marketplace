import type { Logger } from "@marketplace/common";
import { type OrderCreatedEvent, TOPICS, orderCreatedEvent } from "@marketplace/contracts";
import type { Consumer, Kafka } from "kafkajs";
import type { ReserveStockUseCase } from "../../application/use-cases/ReserveStockUseCase.js";

export class OrderEventsConsumer {
  private readonly consumer: Consumer;

  constructor(
    kafka: Kafka,
    groupId: string,
    private readonly reserveStock: ReserveStockUseCase,
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
        let event: OrderCreatedEvent;
        try {
          const raw = JSON.parse(message.value?.toString() ?? "");
          if (raw?.type !== "OrderCreated") return; // los demás eventos de la orden no le interesan a Catalog
          event = orderCreatedEvent.parse(raw);
        } catch (err) {
          // No cumple el contrato: reintentar no lo arregla. Se descarta y se loguea.
          this.logger.error({ err, topic, partition, offset }, "Evento inválido descartado");
          return;
        }

        // Si esto falla (p. ej. base caída) el error se propaga: kafkajs reintenta y el offset no avanza.
        const outcome = await this.reserveStock.execute(event);
        this.logger.info(
          { orderId: event.payload.orderId, outcome: outcome ?? "DUPLICATE", partition, offset },
          "OrderCreated procesado",
        );
      },
    });
    this.logger.info("Consumer de orders.lifecycle iniciado");
  }

  stop(): Promise<void> {
    return this.consumer.disconnect();
  }
}