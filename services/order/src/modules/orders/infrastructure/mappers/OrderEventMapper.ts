import { randomUUID } from "node:crypto";
import { type OrderCreatedEvent, orderCreatedEvent } from "@marketplace/contracts";
import type { OrderDomainEvent } from "../../domain/events/OrderEvents.js";

export function toIntegrationEvent(e: OrderDomainEvent): OrderCreatedEvent {
  const base = { eventId: randomUUID(), version: 1, occurredAt: e.occurredAt };

  switch (e.type) {
    case "OrderCreated":
      return orderCreatedEvent.parse({
        ...base,
        type: e.type,
        aggregateId: e.orderId,
        payload: { orderId: e.orderId, buyerId: e.buyerId, lines: e.lines, total: e.total },
      });
  }
}