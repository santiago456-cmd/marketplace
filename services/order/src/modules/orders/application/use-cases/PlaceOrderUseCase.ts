import { Id } from "@marketplace/common";
import { ProductNotAvailableException } from "../../domain/exceptions/ProductNotAvailableException.js";
import { Order } from "../../domain/models/Order.js";
import type { OrderRepository } from "../../domain/repositories/OrderRepository.js";
import type { OrderResponseDto, PlaceOrderDto } from "../dtos/OrderDto.js";
import type { ProductCatalog } from "../ports/ProductCatalog.js";

export class PlaceOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly catalog: ProductCatalog,
  ) {}

  async execute(buyerId: string, dto: PlaceOrderDto): Promise<OrderResponseDto> {
    const requested = dto.lines.map((l) => ({ productId: Id.from(l.productId).value, quantity: l.quantity }));
    const products = await Promise.all(requested.map((l) => this.catalog.getProduct(l.productId)));

    const lines = requested.map((l, i) => {
      const p = products[i];
      if (!p || p.status !== "ACTIVE" || p.archived) throw new ProductNotAvailableException(l.productId);
      // Se congelan precio y vendedor: la orden no cambia si el catálogo cambia después.
      return { productId: p.productId, sellerId: p.sellerId, name: p.name, unitPrice: p.price, quantity: l.quantity };
    });

    const order = Order.place({ buyerId, lines });
    await this.orders.save(order);
    return order.toPrimitives();
  }
}