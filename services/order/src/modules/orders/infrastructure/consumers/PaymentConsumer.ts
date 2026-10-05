import { ConflictException, DomainException, type Logger } from "@marketplace/common";
import { type OrderEvent, TOPICS, orderConfirmedEvent } from "@marketplace/contracts";
import type { Consumer, Kafka } from "kafkajs";
import type { ProcessPaymentUseCase } from "../../application/use-cases/ProcessPaymentUseCase.js";

type OrderConfirmed = Extract<OrderEvent, { type: "OrderConfirmed" }>;

/** Cuando una orden queda confirmada (stock reservado), la cobra. */
export class PaymentConsumer {
  private readonly consumer: Consumer;

  constructor(
    kafka: Kafka,
    groupId: string,
    private readonly processPayment: ProcessPaymentUseCase,
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
        let event: OrderConfirmed;
        try {
          const raw = JSON.parse(message.value?.toString() ?? "");
          if (raw?.type !== "OrderConfirmed") return; // los demás eventos de la orden no disparan un cobro
          event = orderConfirmedEvent.parse(raw);
        } catch (err) {
          this.logger.error({ err, topic, partition, offset }, "Evento inválido descartado");
          return;
        }

        const orderId = event.payload.orderId;
        try {
          const outcome = await this.processPayment.execute(orderId);
          this.logger.info({ orderId, outcome, partition, offset }, "Pago procesado");
        } catch (err) {
          // Un conflicto de versión sí se arregla reintentando; el resto de errores de dominio no.
          if (err instanceof DomainException && !(err instanceof ConflictException)) {
            this.logger.warn({ err, orderId }, "Pago no aplicable, descartado");
            return;
          }
          throw err; // error de infraestructura: kafkajs reintenta
        }
      },
    });
    this.logger.info("Consumer de pagos iniciado");
  }

  stop(): Promise<void> {
    return this.consumer.disconnect();
  }
}