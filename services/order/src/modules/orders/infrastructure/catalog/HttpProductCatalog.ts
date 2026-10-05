import { z } from "zod";
import type { CatalogProduct, ProductCatalog } from "../../application/ports/ProductCatalog.js";

const catalogProductSchema = z.object({
  productId: z.string().uuid(),
  sellerId: z.string().uuid(),
  name: z.string(),
  price: z.object({ amount: z.number().int(), currency: z.string() }),
  status: z.string(),
  archivedAt: z.string().nullable(),
});

export class HttpProductCatalog implements ProductCatalog {
  constructor(private readonly baseUrl: string) {}

  async getProduct(productId: string): Promise<CatalogProduct | null> {
    const res = await fetch(`${this.baseUrl}/products/${productId}`, { signal: AbortSignal.timeout(3000) });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Catalog respondió ${res.status} al consultar el producto ${productId}`);

    const p = catalogProductSchema.parse(await res.json());
    return {
      productId: p.productId,
      sellerId: p.sellerId,
      name: p.name,
      price: p.price,
      status: p.status,
      archived: p.archivedAt !== null,
    };
  }
}