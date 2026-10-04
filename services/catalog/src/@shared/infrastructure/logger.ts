import type { FastifyBaseLogger } from "fastify";

/** Contrato mínimo de logger del servicio. Compatible con pino y con Fastify. */
export type Logger = FastifyBaseLogger;