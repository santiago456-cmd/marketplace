import Fastify, { type FastifyInstance } from "fastify";
import type { Db } from "./@shared/infrastructure/database/db.js";
import { registerErrorHandler } from "@marketplace/common";
import type { Logger } from "@marketplace/common";
import { ArchiveProductUseCase } from "./modules/products/application/use-cases/ArchiveProductUseCase.js";
import { CreateProductUseCase } from "./modules/products/application/use-cases/CreateProductUseCase.js";
import { GetProductUseCase } from "./modules/products/application/use-cases/GetProductUseCase.js";
import { PublishProductUseCase } from "./modules/products/application/use-cases/PublishProductUseCase.js";
import { UpdateProductPriceUseCase } from "./modules/products/application/use-cases/UpdateProductPriceUseCase.js";
import { UpdateProductStockUseCase } from "./modules/products/application/use-cases/UpdateProductStockUseCase.js";
import { ProductController } from "./modules/products/infrastructure/controllers/ProductController.js";
import { DrizzleProductRepository } from "./modules/products/infrastructure/persistence/DrizzleProductRepository.js";
import { productRoutes } from "./modules/products/infrastructure/routes/products.routes.js";

export function buildApp(deps: { db: Db; logger: Logger }): FastifyInstance {
  const app = Fastify({ loggerInstance: deps.logger });
  registerErrorHandler(app);

  const repository = new DrizzleProductRepository(deps.db);
  const controller = new ProductController({
    create: new CreateProductUseCase(repository),
    get: new GetProductUseCase(repository),
    publish: new PublishProductUseCase(repository),
    updatePrice: new UpdateProductPriceUseCase(repository),
    updateStock: new UpdateProductStockUseCase(repository),
    archive: new ArchiveProductUseCase(repository),
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(productRoutes(controller), { prefix: "/products" });

  return app;
}