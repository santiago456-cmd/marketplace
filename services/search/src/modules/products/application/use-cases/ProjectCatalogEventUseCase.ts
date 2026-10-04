import type { CatalogEvent } from "@marketplace/contracts";
import type { ProductSearchIndex } from "../../domain/repositories/ProductSearchIndex.js";

export class ProjectCatalogEventUseCase {
  constructor(private readonly index: ProductSearchIndex) {}

  async execute(event: CatalogEvent): Promise<void> {
    switch (event.type) {
      case "ProductCreated":
        return; // DRAFT: todavía no es visible en búsqueda

      case "ProductPublished": {
        const p = event.payload;
        return this.index.upsert({
          productId: p.productId,
          sellerId: p.sellerId,
          name: p.name,
          description: p.description,
          categoryId: p.categoryId,
          price: p.price,
          stock: p.stock,
          condition: p.condition,
          publishedAt: event.occurredAt,
        });
      }

      case "ProductPriceUpdated":
        return this.index.updatePrice(event.payload.productId, event.payload.price);

      case "ProductStockUpdated":
        return this.index.updateStock(event.payload.productId, event.payload.stock);

      case "ProductArchived":
        return this.index.remove(event.payload.productId);
    }
  }
}