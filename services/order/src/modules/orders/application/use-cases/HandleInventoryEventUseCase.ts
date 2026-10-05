import { Id } from "@marketplace/common";
import type { InventoryEvent } from "@marketplace/contracts";
import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException.js";
import type { OrderRepository } from "../../domain/repositories/OrderRepository.js";

/** Aplica el resultado de la reserva de stock a la orden. */
export class HandleInventoryEventUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(event: InventoryEvent): Promise<void> {
    // La liberación es la compensación de una cancelación que Order ya conoce: nada que aplicar.
    if (event.type === "StockReleased") return;

    const orderId = event.payload.orderId;
    const order = await this.orders.findById(Id.from(orderId));
    if (!order) throw new OrderNotFoundException(orderId);

    switch (event.type) {
      case "StockReserved":
        order.confirm();
        break;
      case "StockRejected":
        order.reject(event.payload.reason);
        break;
    }
    await this.orders.save(order); // si no hubo cambios (evento duplicado), no escribe nada
  }
}