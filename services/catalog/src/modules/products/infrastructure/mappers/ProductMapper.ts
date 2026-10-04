import { Product } from "../../domain/models/Product.js";
import type { products } from "../persistence/products.schema.js";

type ProductRow = typeof products.$inferSelect;

export const ProductMapper = {
  toDomain(row: ProductRow): Product {
    return Product.reconstitute({
      productId: row.id,
      sellerId: row.sellerId,
      name: row.name,
      description: row.description,
      categoryId: row.categoryId,
      price: { amount: row.priceAmount, currency: row.priceCurrency },
      stock: row.stock,
      condition: row.condition,
      status: row.status,
      archivedAt: row.archivedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      version: row.version,
    });
  },

  toRow(product: Product) {
    const p = product.toPrimitives();
    return {
      id: p.productId,
      sellerId: p.sellerId,
      name: p.name,
      description: p.description,
      categoryId: p.categoryId,
      priceAmount: p.price.amount,
      priceCurrency: p.price.currency,
      stock: p.stock,
      condition: p.condition,
      status: p.status,
      archivedAt: p.archivedAt ? new Date(p.archivedAt) : null,
      createdAt: new Date(p.createdAt),
      updatedAt: new Date(p.updatedAt),
    };
  },
};