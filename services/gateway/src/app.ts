import Fastify, { type FastifyInstance } from "fastify";
import type { Logger } from "./@shared/infrastructure/logger.js";
import { JwtVerifier } from "./modules/auth/infrastructure/JwtVerifier.js";
import { gatewayRoutes } from "./modules/routing/infrastructure/routes.js";

interface Deps {
  logger: Logger;
  jwtSecret: string;
  upstreams: { identity: string; catalog: string; search: string };
}

export function buildApp(deps: Deps): FastifyInstance {
  const app = Fastify({ loggerInstance: deps.logger });

  app.get("/health", async () => ({ status: "ok" }));
  app.register(gatewayRoutes(new JwtVerifier(deps.jwtSecret), deps.upstreams));

  return app;
}
