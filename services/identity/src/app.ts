import Fastify, { type FastifyInstance } from "fastify";
import type { Db } from "./@shared/infrastructure/database/db.js";
import { registerErrorHandler } from "@marketplace/common";
import type { Logger } from "@marketplace/common";
import { GetCurrentUserUseCase } from "./modules/users/application/use-cases/GetCurrentUserUseCase.js";
import { LoginUseCase } from "./modules/users/application/use-cases/LoginUseCase.js";
import { RegisterUserUseCase } from "./modules/users/application/use-cases/RegisterUserUseCase.js";
import { AuthController } from "./modules/users/infrastructure/controllers/AuthController.js";
import { DrizzleUserRepository } from "./modules/users/infrastructure/persistence/DrizzleUserRepository.js";
import { authRoutes } from "./modules/users/infrastructure/routes/auth.routes.js";
import { JoseTokenIssuer } from "./modules/users/infrastructure/security/JoseTokenIssuer.js";
import { ScryptPasswordHasher } from "./modules/users/infrastructure/security/ScryptPasswordHasher.js";

interface Deps {
  db: Db;
  logger: Logger;
  jwt: { secret: string; ttlSeconds: number };
}

export function buildApp(deps: Deps): FastifyInstance {
  const app = Fastify({ loggerInstance: deps.logger });
  registerErrorHandler(app);

  const users = new DrizzleUserRepository(deps.db);
  const hasher = new ScryptPasswordHasher();
  const tokens = new JoseTokenIssuer(deps.jwt.secret, deps.jwt.ttlSeconds);

  const controller = new AuthController({
    register: new RegisterUserUseCase(users, hasher),
    login: new LoginUseCase(users, hasher, tokens),
    getCurrent: new GetCurrentUserUseCase(users),
  });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(authRoutes(controller));

  return app;
}