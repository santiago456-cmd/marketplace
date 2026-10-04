import { z } from "zod";

/** Valida process.env contra un esquema y falla rápido si falta algo. */
export function loadConfig<T extends z.ZodRawShape>(shape: T) {
  const result = z.object(shape).safeParse(process.env);
  if (!result.success) {
    console.error("Configuración inválida:", result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}