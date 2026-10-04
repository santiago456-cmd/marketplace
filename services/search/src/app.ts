import Fastify, { type FastifyInstance } from "fastify";
import { registerErrorHandler } from "./@shared/infrastructure/http/errorHandler.js";
import type { Logger } from "./@shared/infrastructure/logger.js";
import type { SearchProductsUseCase } from "./modules/products/application/use-cases/SearchProductsUseCase.js";
import { SearchController } from "./modules/products/infrastructure/controllers/SearchController.js";
import { searchRoutes } from "./modules/products/infrastructure/routes/search.routes.js";

export function buildApp(deps: { searchProducts: SearchProductsUseCase; logger: Logger }): FastifyInstance {
  const app = Fastify({ loggerInstance: deps.logger });
  registerErrorHandler(app);

  app.get("/health", async () => ({ status: "ok" }));
  app.register(searchRoutes(new SearchController(deps.searchProducts)), { prefix: "/search" });

  return app;
}