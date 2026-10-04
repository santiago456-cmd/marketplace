import { Id } from "../../../../@shared/domain/value-objects/Id.vo.js";
import { ProductNotFoundException } from "../../domain/exceptions/ProductNotFoundException.js";
import type { ProductRepository } from "../../domain/repositories/ProductRepository.js";
import { Price } from "../../domain/value-objects/Price.vo.js";
import { type MoneyDto, type ProductResponseDto, toProductResponse } from "../dtos/ProductDto.js";

export class UpdateProductPriceUseCase {
  constructor(private readonly products: ProductRepository) {}

  async execute(productId: string, actorId: string, dto: MoneyDto): Promise<ProductResponseDto> {
    const product = await this.products.findById(Id.from(productId));
    if (!product) throw new ProductNotFoundException(productId);

    product.assertOwnedBy(actorId);
    product.updatePrice(Price.from(dto.amount, dto.currency));
    await this.products.save(product);
    return toProductResponse(product.toPrimitives());
  }
}