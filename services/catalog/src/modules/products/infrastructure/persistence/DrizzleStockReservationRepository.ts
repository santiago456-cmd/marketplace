import { randomUUID } from "node:crypto";
import { TOPICS, stockRejectedEvent, stockReservedEvent } from "@marketplace/contracts";
import { enqueueOutbox } from "@marketplace/outbox";
import { asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../../../../@shared/infrastructure/database/db.js";
import type { Product } from "../../domain/models/Product.js";
import type { StockReservationRepository } from "../../domain/repositories/StockReservationRepository.js";
import { type ReservationLine, type ReservationOutcome, reserveAll } from "../../domain/services/StockReservation.js";
import { ProductMapper } from "../mappers/ProductMapper.js";
import { persistProduct } from "./persistProduct.js";
import { products } from "./products.schema.js";
import { stockReservations } from "./stock-reservations.schema.js";

export class DrizzleStockReservationRepository implements StockReservationRepository {
  constructor(private readonly db: Db) {}

  async reserve(orderId: string, lines: ReservationLine[]): Promise<ReservationOutcome | null> {
    return this.db.transaction(async (tx) => {
      // 1. Idempotencia: solo el primer procesamiento de la orden consigue insertar la fila.
      const claimed = await tx
        .insert(stockReservations)
        .values({ orderId, status: "PENDING", lines })
        .onConflictDoNothing()
        .returning({ orderId: stockReservations.orderId });
      if (claimed.length === 0) return null;

      // 2. Bloquea los productos. El orden fijo por id evita deadlocks entre reservas concurrentes.
      const ids = [...new Set(lines.map((l) => l.productId))];
      const rows = await tx
        .select()
        .from(products)
        .where(inArray(products.id, ids))
        .orderBy(asc(products.id))
        .for("update");
      const byId = new Map<string, Product>(rows.map((r): [string, Product] => [r.id, ProductMapper.toDomain(r)]));

      // 3. Regla de dominio: todo o nada.
      const outcome = reserveAll(byId, lines);
      const base = { eventId: randomUUID(), version: 1, occurredAt: new Date().toISOString(), aggregateId: orderId };

      // 4. Persistencia atómica del resultado.
      if (outcome.status === "RESERVED") {
        for (const product of byId.values()) await persistProduct(tx, product); // + ProductStockUpdated
        await tx.update(stockReservations).set({ status: "RESERVED" }).where(eq(stockReservations.orderId, orderId));
        const event = stockReservedEvent.parse({ ...base, type: "StockReserved", payload: { orderId, lines } });
        await enqueueOutbox(tx, TOPICS.CATALOG_INVENTORY, [event]);
      } else {
        // Los agregados mutados en memoria se descartan: el stock no se toca.
        await tx
          .update(stockReservations)
          .set({ status: "REJECTED", reason: outcome.reason })
          .where(eq(stockReservations.orderId, orderId));
        const event = stockRejectedEvent.parse({ ...base, type: "StockRejected", payload: { orderId, reason: outcome.reason } });
        await enqueueOutbox(tx, TOPICS.CATALOG_INVENTORY, [event]);
      }
      return outcome;
    });
  }
}