import type { FastifyInstance } from "fastify";
import type { ProductController } from "../controllers/ProductController.js";

export const productRoutes = (controller: ProductController) => async (app: FastifyInstance) => {
  app.post("/", controller.create);
  app.get("/:id", controller.get);
  app.post("/:id/publish", controller.publish);
  app.patch("/:id/price", controller.updatePrice);
  app.patch("/:id/stock", controller.updateStock);
  app.delete("/:id", controller.archive);
};