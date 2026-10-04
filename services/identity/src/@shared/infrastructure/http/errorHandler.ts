import type { FastifyError, FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { DomainException } from "../../domain/exceptions/DomainException.js";

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  BUSINESS_RULE_VIOLATION: 422,
};

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Datos de entrada inválidos",
        details: error.flatten().fieldErrors,
      });
    }

    if (error instanceof DomainException) {
      return reply.status(STATUS_BY_CODE[error.code] ?? 400).send({ code: error.code, message: error.message });
    }

    // Errores propios de Fastify (JSON malformado, etc.)
    const fastifyError = error as FastifyError;
    if (fastifyError.statusCode && fastifyError.statusCode < 500) {
      return reply
        .status(fastifyError.statusCode)
        .send({ code: fastifyError.code ?? "BAD_REQUEST", message: fastifyError.message });
    }

    req.log.error({ err: error }, "Error no controlado");
    return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Error interno del servidor" });
  });
}