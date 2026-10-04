import { Id } from "@marketplace/common";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException.js";
import type { ProductRepository } from "../../domain/repositories/ProductRepository.js";
import { type ProductResponseDto, toProductResponse } from "../dtos/ProductDto.js";

export class GetProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(productId: string): Promise<ProductResponseDto> {
    const product = await this.products.findById(Id.from(productId));
    if (!product) throw new ProductNotFoundException(productId);
    return toProductResponse(product.toPrimitives());
  }
}