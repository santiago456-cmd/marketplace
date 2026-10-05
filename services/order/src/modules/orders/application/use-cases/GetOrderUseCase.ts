import { Id } from "@marketplace/common";
import { OrderNotFoundException } from "../../domain/exceptions/OrderNotFoundException.js";
import type { OrderRepository } from "../../domain/repositories/OrderRepository.js";
import type { OrderResponseDto } from "../dtos/OrderDto.js";

export class GetOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(orderId: string, actorId: string): Promise<OrderResponseDto> {
    const order = await this.orders.findById(Id.from(orderId));
    if (!order) throw new OrderNotFoundException(orderId);

    order.assertOwnedBy(actorId);
    return order.toPrimitives();
  }
}