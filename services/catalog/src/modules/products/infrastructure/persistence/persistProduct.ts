import { ConflictException } from "@marketplace/common";
import { TOPICS } from "@marketplace/contracts";
import { type Tx, enqueueOutbox } from "@marketplace/outbox";
import { and, eq } from "drizzle-orm";
import type { Product } from "../../domain/models/Product.js";
import { toIntegrationEvent } from "../mappers/ProductEventMapper.js";
import { ProductMapper } from "../mappers/ProductMapper.js";
import { products } from "./products.schema.js";

/** Guarda el agregado y sus eventos pendientes dentro de la transacción recibida. */
export async function persistProduct(tx: Tx, product: Product): Promise<void> {
  const { id, createdAt, ...changes } = ProductMapper.toRow(product);
  const expectedVersion = product.version;
  const integrationEvents = product.pullEvents().map(toIntegrationEvent);

  if (expectedVersion === 0) {
    await tx.insert(products).values({ id, createdAt, ...changes, version: 1 });
  } else {
    // Bloqueo optimista: solo actualiza si nadie modificó el producto desde que lo leímos.
    const updated = await tx
      .update(products)
      .set({ ...changes, version: expectedVersion + 1 })
      .where(and(eq(products.id, id), eq(products.version, expectedVersion)))
      .returning({ id: products.id });

    if (updated.length === 0) {
      throw new ConflictException("El producto fue modificado concurrentemente, reintenta la operación");
    }
  }

  // Mismo tx: producto y eventos se confirman juntos o no se confirma nada.
  await enqueueOutbox(tx, TOPICS.CATALOG_PRODUCTS, integrationEvents);
}