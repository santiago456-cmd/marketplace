import { Id, ValidationException } from "@marketplace/common";
import type { OrderLineSnapshot } from "../events/OrderEvents.js";
import { Money } from "./Money.vo.js";
import { Quantity } from "./Quantity.vo.js";

export class OrderLine {
  private constructor(
    readonly productId: Id,
    readonly sellerId: Id,
    readonly name: string,
    readonly unitPrice: Money,
    readonly quantity: Quantity,
  ) {}

  static from(s: OrderLineSnapshot): OrderLine {
    const name = s.name.trim();
    if (!name) throw new ValidationException("El nombre del producto es obligatorio");
    return new OrderLine(
      Id.from(s.productId),
      Id.from(s.sellerId),
      name,
      Money.from(s.unitPrice.amount, s.unitPrice.currency),
      Quantity.from(s.quantity),
    );
  }

  subtotal(): Money {
    return this.unitPrice.times(this.quantity.value);
  }

  toSnapshot(): OrderLineSnapshot {
    return {
      productId: this.productId.value,
      sellerId: this.sellerId.value,
      name: this.name,
      unitPrice: this.unitPrice.toPrimitives(),
      quantity: this.quantity.value,
    };
  }
}