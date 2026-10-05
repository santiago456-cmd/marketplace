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
  statusReason: string | null;
  paymentId: string | null;
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

  get status(): OrderStatus {
    return this.state.status;
  }

  assertOwnedBy(userId: string): void {
    if (!this.state.buyerId.equals(Id.from(userId))) throw new OrderNotOwnedException(this.id);
  }

  /**
   * El stock quedó reservado. Idempotente: una reentrega sobre una orden que ya avanzó
   * (CONFIRMED, PAID, CANCELLED) no hace nada. Solo es contradictorio confirmar una REJECTED.
   */
  confirm(): void {
    if (this.state.status === "REJECTED") {
      throw new BusinessRuleException("No se puede confirmar una orden en estado REJECTED");
    }
    if (this.state.status !== "CREATED") return;
    this.record({ type: "OrderConfirmed", occurredAt: DateValue.now().toISOString(), orderId: this.id });
  }

  /** No hubo stock. Idempotente: rechazar una orden ya rechazada no hace nada. */
  reject(reason: string): void {
    if (this.state.status === "REJECTED") return;
    if (this.state.status !== "CREATED") {
      throw new BusinessRuleException(`No se puede rechazar una orden en estado ${this.state.status}`);
    }
    const trimmed = reason.trim();
    if (!trimmed) throw new ValidationException("El motivo del rechazo es obligatorio");
    this.record({ type: "OrderRejected", occurredAt: DateValue.now().toISOString(), orderId: this.id, reason: trimmed });
  }

  /** El pago fue aprobado. Idempotente. Solo se paga una orden CONFIRMED. */
  pay(paymentId: string): void {
    if (this.state.status === "PAID") return;
    if (this.state.status !== "CONFIRMED") {
      throw new BusinessRuleException(`No se puede pagar una orden en estado ${this.state.status}`);
    }
    const id = paymentId.trim();
    if (!id) throw new ValidationException("El identificador del pago es obligatorio");
    this.record({ type: "OrderPaid", occurredAt: DateValue.now().toISOString(), orderId: this.id, paymentId: id });
  }

  /** El pago falló: la orden se cancela y Catalog repone el stock. Idempotente. */
  cancel(reason: string): void {
    if (this.state.status === "CANCELLED") return;
    if (this.state.status !== "CONFIRMED") {
      throw new BusinessRuleException(`No se puede cancelar una orden en estado ${this.state.status}`);
    }
    const trimmed = reason.trim();
    if (!trimmed) throw new ValidationException("El motivo de la cancelación es obligatorio");
    this.record({ type: "OrderCancelled", occurredAt: DateValue.now().toISOString(), orderId: this.id, reason: trimmed });
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
      statusReason: s.statusReason,
      paymentId: s.paymentId,
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
          statusReason: null,
          paymentId: null,
          createdAt: DateValue.from(event.occurredAt),
        };
        break;
      case "OrderConfirmed":
        this.state = { ...this.state, status: "CONFIRMED" };
        break;
      case "OrderRejected":
        this.state = { ...this.state, status: "REJECTED", statusReason: event.reason };
        break;
      case "OrderPaid":
        this.state = { ...this.state, status: "PAID", paymentId: event.paymentId };
        break;
      case "OrderCancelled":
        this.state = { ...this.state, status: "CANCELLED", statusReason: event.reason };
        break;
    }
    this.history.push(event);
  }
}