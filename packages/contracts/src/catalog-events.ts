import { z } from "zod";

/** Sobre común de todos los eventos. */
export const eventEnvelope = <T extends string, P extends z.ZodTypeAny>(
  type: T,
  payload: P,
) =>
  z.object({
    eventId: z.string().uuid(),
    type: z.literal(type),
    version: z.literal(1),
    occurredAt: z.string().datetime(),
    aggregateId: z.string().uuid(), // se usa como key de Kafka (orden por producto)
    payload,
  });

/** Dinero en unidades menores (centavos) para evitar errores de punto flotante. */
export const moneySchema = z.object({
  amount: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

export const productConditionSchema = z.enum(["NEW", "USED"]);
export const publicationStatusSchema = z.enum(["DRAFT", "ACTIVE", "PAUSED", "SUSPENDED"]);

/** Snapshot completo: Search puede indexar solo con este payload. */
export const productSnapshotSchema = z.object({
  productId: z.string().uuid(),
  sellerId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  categoryId: z.string(),
  price: moneySchema,
  stock: z.number().int().nonnegative(),
  condition: productConditionSchema,
  status: publicationStatusSchema,
});

export const productCreatedEvent = eventEnvelope("ProductCreated", productSnapshotSchema);
export const productPublishedEvent = eventEnvelope("ProductPublished", productSnapshotSchema);
export const productPriceUpdatedEvent = eventEnvelope(
  "ProductPriceUpdated",
  z.object({ productId: z.string().uuid(), price: moneySchema }),
);
export const productStockUpdatedEvent = eventEnvelope(
  "ProductStockUpdated",
  z.object({ productId: z.string().uuid(), stock: z.number().int().nonnegative() }),
);
export const productArchivedEvent = eventEnvelope(
  "ProductArchived",
  z.object({ productId: z.string().uuid() }),
);

export const catalogEventSchema = z.discriminatedUnion("type", [
  productCreatedEvent,
  productPublishedEvent,
  productPriceUpdatedEvent,
  productStockUpdatedEvent,
  productArchivedEvent,
]);

export type CatalogEvent = z.infer<typeof catalogEventSchema>;
export type ProductSnapshot = z.infer<typeof productSnapshotSchema>;

export const parseCatalogEvent = (raw: unknown): CatalogEvent =>
  catalogEventSchema.parse(raw);