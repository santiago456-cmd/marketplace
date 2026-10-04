import { ValidationException } from "../../../../@shared/domain/exceptions/DomainException.js";
import type { SearchResult } from "../../domain/models/SearchCriteria.js";
import type { ProductSearchIndex } from "../../domain/repositories/ProductSearchIndex.js";
import type { SearchProductsDto } from "../dtos/SearchProductsDto.js";

export class SearchProductsUseCase {
  constructor(private readonly index: ProductSearchIndex) {}

  async execute(dto: SearchProductsDto): Promise<SearchResult> {
    if (dto.minPrice !== undefined && dto.maxPrice !== undefined && dto.minPrice > dto.maxPrice) {
      throw new ValidationException("minPrice no puede ser mayor que maxPrice");
    }
    return this.index.search(dto);
  }
}