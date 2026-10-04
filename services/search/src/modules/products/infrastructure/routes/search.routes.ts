import type { FastifyInstance } from "fastify";
import type { SearchController } from "../controllers/SearchController.js";

export const searchRoutes = (controller: SearchController) => async (app: FastifyInstance) => {
  app.get("/products", controller.search);
};