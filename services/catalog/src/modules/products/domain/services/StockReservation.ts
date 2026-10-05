import { DomainException } from "@marketplace/common";
import type { Product } from "../models/Product.js";

export interface ReservationLine {
  productId: string;
  quantity: number;
}

export type ReservationOutcome = { status: "RESERVED" } | { status: "REJECTED"; reason: string };

/**
 * Reserva todas las líneas o ninguna. Muta los agregados en memoria:
 * si devuelve REJECTED, quien llama debe descartarlos sin guardar.
 */
export function reserveAll(products: ReadonlyMap<string, Product>, lines: ReservationLine[]): ReservationOutcome {
  for (const line of lines) {
    const product = products.get(line.productId);
    if (!product) return { status: "REJECTED", reason: `Producto no encontrado: ${line.productId}` };
    try {
      product.reserve(line.quantity);
    } catch (err) {
      if (err instanceof DomainException) return { status: "REJECTED", reason: err.message };
      throw err;
    }
  }
  return { status: "RESERVED" };
}