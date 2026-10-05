import { type Logger, registerErrorHandler } from "@marketplace/common";
import Fastify, { type FastifyInstance } from "fastify";
import type { Db} from "./src/@shared/infrastructure/database/db.js"
import { GetOrderUseCase } from "./src/modules/orders/application/use-cases/GetOrderUseCase.js";
import { PlaceOrderUseCase } from "./src/modules/orders/application/use-cases/PlaceOrderUseCase.js";
import { HttpProductCatalog } from "./src/modules/orders/infrastructure/catalog/HttpProductCatalog.js";
import { OrderController } from "./src/modules/orders/infrastructure/controllers/OrderController.js";
import { DrizzleOrderRepository } from "./src/modules/orders/infrastructure/persistence/DrizzleOrderRepository.js";
import { orderRoutes } from "./src/modules/orders/infrastructure/routes/orders.routes.js";

interface Deps {
  db: Db;
  logger: Logger;
  catalogUrl: string;
}

export function buildApp(deps: Deps): FastifyInstance {
  const app = Fastify({ loggerInstance: deps.logger });
  registerErrorHandler(app);

  const orders = new DrizzleOrderRepository(deps.db);
  const catalog = new HttpProductCatalog(deps.catalogUrl);
  const controller = new OrderController({
    place: new PlaceOrderUseCase(orders, catalog),
    get: new GetOrderUseCase(orders),
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(orderRoutes(controller), { prefix: "/orders" });

  return app;
}