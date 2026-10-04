import { Id } from "@marketplace/common";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException.js";
import type { ProductRepository } from "../../domain/repositories/ProductRepository.js";
import { Stock } from "../../domain/value-objects/Stock.vo.js";
import { type ProductResponseDto, toProductResponse } from "../dtos/ProductDto.js";

export class UpdateProductStockUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(productId: string, actorId: string, stock: number): Promise<ProductResponseDto> {
    const product = await this.products.findById(Id.from(productId));
    if (!product) throw new ProductNotFoundException(productId);

    product.assertOwnedBy(actorId);
    product.updateStock(Stock.from(stock));
    await this.products.save(product);
    return toProductResponse(product.toPrimitives());
  }
}