import { Id } from "../../../../@shared/domain/value-objects/Id.vo.js";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException.js";
import type { ProductRepository } from "../../domain/repositories/ProductRepository.js";
import { type ProductResponseDto, toProductResponse } from "../dtos/ProductDto.js";

export class PublishProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(productId: string, actorId: string): Promise<ProductResponseDto> {
    const product = await this.products.findById(Id.from(productId));
    if (!product) throw new ProductNotFoundException(productId);

    product.assertOwnedBy(actorId);
    product.publish();
    await this.products.save(product);
    return toProductResponse(product.toPrimitives());
  }
}