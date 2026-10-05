import type { Id } from "@marketplace/common";
import { eq } from "drizzle-orm";
import type { Db } from "../../../../@shared/infrastructure/database/db.js";
import type { Product } from "../../domain/models/Product.js";
import type { ProductRepository } from "../../domain/repositories/ProductRepository.js";
import { ProductMapper } from "../mappers/ProductMapper.js";
import { persistProduct } from "./persistProduct.js";
import { products } from "./products.schema.js";

export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: Db) {}

  async findById(id: Id): Promise<Product | null> {
    const [row] = await this.db.select().from(products).where(eq(products.id, id.value)).limit(1);
    return row ? ProductMapper.toDomain(row) : null;
  }

  async save(product: Product): Promise<void> {
    await this.db.transaction((tx) => persistProduct(tx, product));
  }
}