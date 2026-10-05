import { Id } from "@marketplace/common";
import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException.js";
import type { OrderRepository } from "../../domain/repositories/OrderRepository.js";
import type { PaymentGateway } from "../ports/PaymentGateway.js";

export type PaymentOutcome = "PAID" | "CANCELLED" | "SKIPPED";

export class ProcessPaymentUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly gateway: PaymentGateway,
  ) {}

  async execute(orderId: string): Promise<PaymentOutcome> {
    const order = await this.orders.findById(Id.from(orderId));
    if (!order) throw new OrderNotFoundException(orderId);

    // Solo se cobra una orden que espera el pago. Un evento reentregado no vuelve a cobrar.
    if (order.status !== "CONFIRMED") return "SKIPPED";

    const result = await this.gateway.charge({ orderId, amount: order.toPrimitives().total });
    if (result.approved) {
      order.pay(result.paymentId);
    } else {
      order.cancel(`Pago rechazado: ${result.reason}`);
    }
    await this.orders.save(order);
    return result.approved ? "PAID" : "CANCELLED";
  }
}