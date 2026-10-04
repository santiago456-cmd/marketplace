import { randomUUID } from "node:crypto";
import { type CatalogEvent, catalogEventSchema } from "@marketplace/contracts";
import type { ProductDomainEvent } from "../../domain/events/ProductEvents.js";

export function toIntegrationEvent(e: ProductDomainEvent): CatalogEvent {
  const base = { eventId: randomUUID(), version: 1, occurredAt: e.occurredAt };

  switch (e.type) {
    case "ProductCreated":
    case "ProductPublished":
      return catalogEventSchema.parse({
        ...base,
        type: e.type,
        aggregateId: e.snapshot.productId,
        payload: e.snapshot,
      });
    case "ProductPriceUpdated":
      return catalogEventSchema.parse({
        ...base,
        type: e.type,
        aggregateId: e.productId,
        payload: { productId: e.productId, price: e.price },
      });
    case "ProductStockUpdated":
      return catalogEventSchema.parse({
        ...base,
        type: e.type,
        aggregateId: e.productId,
        payload: { productId: e.productId, stock: e.stock },
      });
    case "ProductArchived":
      return catalogEventSchema.parse({
        ...base,
        type: e.type,
        aggregateId: e.productId,
        payload: { productId: e.productId },
      });
  }
}