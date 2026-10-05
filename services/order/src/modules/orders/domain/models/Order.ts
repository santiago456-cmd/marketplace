import { BusinessRuleException, DateValue, Id, ValidationException } from "@marketplace/common";
import type { OrderDomainEvent, OrderLineSnapshot } from "../events/OrderEvents.js";
import { OrderNotOwnedException } from "../exceptions/OrderNotOwnedException.js";
import { Money } from "../value-objects/Money.vo.js";
import { OrderLine } from "../value-objects/OrderLine.vo.js";
import type { OrderStatus } from "../value-objects/OrderStatus.vo.js";
import type { OrderPrimitives } from "./OrderPrimitives.js";

const MAX_LINES = 10;

interface OrderState {
  id: Id;
  buyerId: Id;
  lines: OrderLine[];
  total: Money;
  status: OrderStatus;
  createdAt: DateValue;
}

export class Order {
  private state!: OrderState;
  private readonly history: OrderDomainEvent[] = [];
  private pending: OrderDomainEvent[] = [];
  /** Cantidad de eventos ya persistidos: sirve para el control de concurrencia. */
  private persistedVersion = 0;

  private constructor() {}

  static place(input: { buyerId: string; lines: OrderLineSnapshot[] }): Order {
    const buyerId = Id.from(input.buyerId);
    if (input.lines.length === 0) throw new ValidationException("La orden debe tener al menos un producto");
    if (input.lines.length > MAX_LINES) throw new ValidationException(`Máximo ${MAX_LINES} productos por orden`);

    const lines = input.lines.map((l) => OrderLine.from(l));
    if (new Set(lines.map((l) => l.productId.value)).size !== lines.length) {
      throw new ValidationException("No repitas productos en la orden: ajusta la cantidad");
    }
    if (lines.some((l) => l.sellerId.equals(buyerId))) {
      throw new BusinessRuleException("No puedes comprar tus propios productos");
    }
    const total = lines.map((l) => l.subtotal()).reduce((a, b) => a.plus(b));

    const order = new Order();
    order.record({
      type: "OrderCreated",
      occurredAt: DateValue.now().toISOString(),
      orderId: Id.generate().value,
      buyerId: buyerId.value,
      lines: lines.map((l) => l.toSnapshot()),
      total: total.toPrimitives(),
    });
    return order;
  }

  /** Reconstruye el estado repitiendo los eventos. No genera eventos nuevos. */
  static fromHistory(events: OrderDomainEvent[]): Order {
    const order = new Order();
    for (const event of events) order.apply(event);
    order.persistedVersion = events.length;
    return order;
  }

  get id(): string {
    return this.state.id.value;
  }

  get version(): number {
    return this.persistedVersion;
  }

  assertOwnedBy(userId: string): void {
    if (!this.state.buyerId.equals(Id.from(userId))) throw new OrderNotOwnedException(this.id);
  }

  pullEvents(): OrderDomainEvent[] {
    const pending = this.pending;
    this.pending = [];
    return pending;
  }

  toPrimitives(): OrderPrimitives {
    const s = this.state;
    return {
      orderId: s.id.value,
      buyerId: s.buyerId.value,
      status: s.status,
      lines: s.lines.map((l) => l.toSnapshot()),
      total: s.total.toPrimitives(),
      createdAt: s.createdAt.toISOString(),
      history: this.history.map((e) => ({ type: e.type, occurredAt: e.occurredAt })),
    };
  }

  private record(event: OrderDomainEvent): void {
    this.apply(event);
    this.pending.push(event);
  }

  /** Único lugar donde cambia el estado: sin validaciones, porque los eventos ya ocurrieron. */
  private apply(event: OrderDomainEvent): void {
    switch (event.type) {
      case "OrderCreated":
        this.state = {
          id: Id.from(event.orderId),
          buyerId: Id.from(event.buyerId),
          lines: event.lines.map((l) => OrderLine.from(l)),
          total: Money.from(event.total.amount, event.total.currency),
          status: "CREATED",
          createdAt: DateValue.from(event.occurredAt),
        };
        break;
    }
    this.history.push(event);
  }
}