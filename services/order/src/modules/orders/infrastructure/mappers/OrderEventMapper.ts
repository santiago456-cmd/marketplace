import { randomUUID } from "node:crypto";
import { type OrderEvent, orderEventSchema } from "@marketplace/contracts";
import type { OrderDomainEvent } from "../../domain/events/OrderEvents.js";

export function toIntegrationEvent(e: OrderDomainEvent): OrderEvent {
  const base = { eventId: randomUUID(), version: 1, occurredAt: e.occurredAt, aggregateId: e.orderId, type: e.type };

  switch (e.type) {
    case "OrderCreated":
      return orderEventSchema.parse({
        ...base,
        payload: { orderId: e.orderId, buyerId: e.buyerId, lines: e.lines, total: e.total },
      });
    case "OrderConfirmed":
      return orderEventSchema.parse({ ...base, payload: { orderId: e.orderId } });
    case "OrderRejected":
    case "OrderCancelled":
      return orderEventSchema.parse({ ...base, payload: { orderId: e.orderId, reason: e.reason } });
    case "OrderPaid":
      return orderEventSchema.parse({ ...base, payload: { orderId: e.orderId, paymentId: e.paymentId } });
  }
}