import { Id } from "@marketplace/common";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException.js";
import type { ProductRepository } from "../../domain/repositories/ProductRepository.js";

export class ArchiveProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(productId: string, actorId: string): Promise<void> {
    const product = await this.products.findById(Id.from(productId));
    if (!product) throw new ProductNotFoundException(productId);

    product.assertOwnedBy(actorId);
    product.archive();
    await this.products.save(product);
  }
}