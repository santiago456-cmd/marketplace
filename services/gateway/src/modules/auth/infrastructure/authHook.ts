import { type AccessTokenClaims, AUTH_HEADERS, type Role, toAuthHeaders } from "@marketplace/contracts";
import type { FastifyReply, FastifyRequest } from "fastify";
import type { JwtVerifier } from "./JwtVerifier.js";

interface AuthHookOptions {
  /** Si devuelve true, la petición pasa sin token (pero igual se limpian los headers de identidad). */
  isPublic?: (req: FastifyRequest) => boolean;
  /** Roles aceptados: basta con tener uno. */
  roles?: Role[];
}

export const authHook =
  (verifier: JwtVerifier, options: AuthHookOptions = {}) =>
  async (req: FastifyRequest, reply: FastifyReply) => {
    // Nunca se confía en una identidad enviada por el cliente.
    delete req.headers[AUTH_HEADERS.USER_ID];
    delete req.headers[AUTH_HEADERS.USER_ROLES];

    if (options.isPublic?.(req)) return;

    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme?.toLowerCase() !== "bearer" || !token) {
      return reply.status(401).send({ code: "UNAUTHORIZED", message: "Falta el token de acceso" });
    }

    let claims: AccessTokenClaims;
    try {
      claims = await verifier.verify(token);
    } catch {
      return reply.status(401).send({ code: "UNAUTHORIZED", message: "Token inválido o expirado" });
    }

    if (options.roles && !options.roles.some((role) => claims.roles.includes(role))) {
      return reply.status(403).send({ code: "FORBIDDEN", message: "No tienes permisos para esta operación" });
    }

    // Los servicios internos reciben la identidad ya verificada, no el token.
    delete req.headers.authorization;
    Object.assign(req.headers, toAuthHeaders({ userId: claims.sub, roles: claims.roles }));
  };