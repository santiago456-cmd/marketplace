import { TOPICS } from "@marketplace/contracts";
import { and, eq } from "drizzle-orm";
import { ConflictException } from "@marketplace/common";
import type { Id } from "@marketplace/common";
import type { Db } from "../../../../@shared/infrastructure/database/db.js";
import { enqueueOutbox } from "@marketplace/outbox";
import type { Product } from "../../domain/models/Product.js";
import type { ProductRepository } from "../../domain/repositories/ProductRepository.js";
import { toIntegrationEvent } from "../mappers/ProductEventMapper.js";
import { ProductMapper } from "../mappers/ProductMapper.js";
import { products } from "./products.schema.js";

export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: Db) {}

  async findById(id: Id): Promise<Product | null> {
    const [row] = await this.db.select().from(products).where(eq(products.id, id.value)).limit(1);
    return row ? ProductMapper.toDomain(row) : null;
  }

  async save(product: Product): Promise<void> {
    const { id, createdAt, ...changes } = ProductMapper.toRow(product);
    const expectedVersion = product.version;
    const integrationEvents = product.pullEvents().map(toIntegrationEvent);

    await this.db.transaction(async (tx) => {
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
    });
  }
}