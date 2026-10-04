import type { FastifyBaseLogger } from "fastify";
import pino from "pino";

/** Contrato de logger de los servicios: compatible con pino y con Fastify. */
export type Logger = FastifyBaseLogger;

export const createLogger = (name: string) =>
  pino({
    name,
    level: process.env.LOG_LEVEL ?? "info",
    transport:
      process.env.NODE_ENV === "production"
        ? undefined
        : { target: "pino-pretty", options: { colorize: true } },
  });