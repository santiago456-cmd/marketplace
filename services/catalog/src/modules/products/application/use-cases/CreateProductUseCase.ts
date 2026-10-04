import { Product } from "../../domain/models/Product.js";
import type { ProductRepository } from "../../domain/repositories/ProductRepository.js";
import { type CreateProductDto, type ProductResponseDto, toProductResponse } from "../dtos/ProductDto.js";

export class CreateProductUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(dto: CreateProductDto): Promise<ProductResponseDto> {
    const product = Product.create(dto);
    await this.products.save(product);
    return toProductResponse(product.toPrimitives());
  }
}