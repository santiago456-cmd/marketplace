import type { FastifyRequest } from "fastify";
import type { SearchProductsUseCase } from "../../application/use-cases/SearchProductsUseCase.js";
import { searchQuerySchema } from "./search.schemas.js";

export class SearchController {
  constructor(private readonly searchProducts: SearchProductsUseCase) {}

  search = async (req: FastifyRequest) => {
    const { q, ...rest } = searchQuerySchema.parse(req.query);
    return this.searchProducts.execute({ ...rest, text: q });
  };
}