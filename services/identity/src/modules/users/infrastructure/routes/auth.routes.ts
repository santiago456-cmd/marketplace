import type { FastifyInstance } from "fastify";
import type { AuthController } from "../controllers/AuthController.js";

export const authRoutes = (controller: AuthController) => async (app: FastifyInstance) => {
  app.post("/auth/register", controller.register);
  app.post("/auth/login", controller.login);
  app.get("/users/me", controller.me);
};