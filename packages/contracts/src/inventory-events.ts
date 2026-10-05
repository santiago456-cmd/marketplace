import { z } from "zod";
import { eventEnvelope } from "./catalog-events.js";

export const stockReservedEvent = eventEnvelope(
  "StockReserved",
  z.object({
    orderId: z.string().uuid(),
    lines: z
      .array(z.object({ productId: z.string().uuid(), quantity: z.number().int().positive() }))
      .min(1),
  }),
);

export const stockRejectedEvent = eventEnvelope(
  "StockRejected",
  z.object({ orderId: z.string().uuid(), reason: z.string().min(1) }),
);

export const inventoryEventSchema = z.discriminatedUnion("type", [stockReservedEvent, stockRejectedEvent]);

export type InventoryEvent = z.infer<typeof inventoryEventSchema>;

export const parseInventoryEvent = (raw: unknown): InventoryEvent => inventoryEventSchema.parse(raw);