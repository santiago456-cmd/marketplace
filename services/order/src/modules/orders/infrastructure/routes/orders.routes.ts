import type { FastifyInstance } from "fastify";
import type { OrderController } from "../controllers/OrderController.js";

export const orderRoutes = (controller: OrderController) => async (app: FastifyInstance) => {
  app.post("/", controller.place);
  app.get("/:id", controller.get);
};