import { z } from "zod";
import { eventEnvelope, moneySchema } from "./catalog-events.js";

/** Línea de la orden con el precio y el vendedor congelados al momento de la compra. */
export const orderLineSchema = z.object({
  productId: z.string().uuid(),
  sellerId: z.string().uuid(),
  name: z.string().min(1),
  unitPrice: moneySchema,
  quantity: z.number().int().positive(),
});

export const orderCreatedEvent = eventEnvelope(
  "OrderCreated",
  z.object({
    orderId: z.string().uuid(),
    buyerId: z.string().uuid(),
    lines: z.array(orderLineSchema).min(1),
    total: moneySchema,
  }),
);

export const orderConfirmedEvent = eventEnvelope("OrderConfirmed", z.object({ orderId: z.string().uuid() }));

export const orderRejectedEvent = eventEnvelope(
  "OrderRejected",
  z.object({ orderId: z.string().uuid(), reason: z.string().min(1) }),
);

export const orderEventSchema = z.discriminatedUnion("type", [
  orderCreatedEvent,
  orderConfirmedEvent,
  orderRejectedEvent,
]);

export type OrderLine = z.infer<typeof orderLineSchema>;
export type OrderCreatedEvent = z.infer<typeof orderCreatedEvent>;
export type OrderEvent = z.infer<typeof orderEventSchema>;