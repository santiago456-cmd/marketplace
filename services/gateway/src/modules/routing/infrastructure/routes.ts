import httpProxy from "@fastify/http-proxy";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { authHook } from "../../auth/infrastructure/authHook.js";
import type { JwtVerifier } from "../../auth/infrastructure/JwtVerifier.js";

interface Upstreams {
  identity: string;
  catalog: string;
  search: string;
}

const isRead = (req: FastifyRequest) => ["GET", "HEAD", "OPTIONS"].includes(req.method);
const always = () => true;

export const gatewayRoutes = (verifier: JwtVerifier, upstreams: Upstreams) => async (app: FastifyInstance) => {
  // Registro y login: públicos.
  await app.register(httpProxy, {
    upstream: upstreams.identity,
    prefix: "/auth",
    rewritePrefix: "/auth",
    preHandler: authHook(verifier, { isPublic: always }),
  });

  // /users/me: cualquier usuario autenticado.
  await app.register(httpProxy, {
    upstream: upstreams.identity,
    prefix: "/users",
    rewritePrefix: "/users",
    preHandler: authHook(verifier),
  });

  // Catálogo: lectura pública; crear/modificar exige rol SELLER.
  // El dueño del producto lo valida el propio Catalog.
  await app.register(httpProxy, {
    upstream: upstreams.catalog,
    prefix: "/products",
    rewritePrefix: "/products",
    preHandler: authHook(verifier, { isPublic: isRead, roles: ["SELLER"] }),
  });

  // Búsqueda: pública.
  await app.register(httpProxy, {
    upstream: upstreams.search,
    prefix: "/search",
    rewritePrefix: "/search",
    preHandler: authHook(verifier, { isPublic: always }),
  });
};