import type { ProductSnapshot } from "../models/ProductPrimitives.js";

export type ProductDomainEvent =
  | { type: "ProductCreated"; occurredAt: string; snapshot: ProductSnapshot }
  | { type: "ProductPublished"; occurredAt: string; snapshot: ProductSnapshot }
  | { type: "ProductPriceUpdated"; occurredAt: string; productId: string; price: { amount: number; currency: string } }
  | { type: "ProductStockUpdated"; occurredAt: string; productId: string; stock: number }
  | { type: "ProductArchived"; occurredAt: string; productId: string };