import type { MoneySnapshot, OrderLineSnapshot } from "../events/OrderEvents.js";

export interface OrderPrimitives {
  orderId: string;
  buyerId: string;
  status: string;
  lines: OrderLineSnapshot[];
  total: MoneySnapshot;
  createdAt: string;
  /** Resumen del event store: qué le pasó a la orden y cuándo. */
  history: { type: string; occurredAt: string }[];
}