import { ConflictException, type Id } from "@marketplace/common";
import { TOPICS } from "@marketplace/contracts";
import { enqueueOutbox } from "@marketplace/outbox";
import { asc, eq } from "drizzle-orm";
import type { Db } from "../../../../@shared/infrastructure/database/db.js";
import { isUniqueViolation } from "../../../../@shared/infrastructure/database/errors.js";
import type { OrderDomainEvent } from "../../domain/events/OrderEvents.js";
import { Order } from "../../domain/models/Order.js";
import type { OrderRepository } from "../../domain/repositories/OrderRepository.js";
import { toIntegrationEvent } from "../mappers/OrderEventMapper.js";
import { orderEvents } from "./order-events.schema.js";

export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly db: Db) {}

  async findById(id: Id): Promise<Order | null> {
    const rows = await this.db
      .select()
      .from(orderEvents)
      .where(eq(orderEvents.orderId, id.value))
      .orderBy(asc(orderEvents.version));

    if (rows.length === 0) return null;
    return Order.fromHistory(rows.map((r) => r.payload as OrderDomainEvent));
  }

  async save(order: Order): Promise<void> {
    const expectedVersion = order.version;
    const events = order.pullEvents();
    if (events.length === 0) return;

    const rows = events.map((e, i) => ({
      orderId: order.id,
      version: expectedVersion + i + 1,
      type: e.type,
      payload: e,
      occurredAt: new Date(e.occurredAt),
    }));
    const integrationEvents = events.map(toIntegrationEvent);

    await this.db.transaction(async (tx) => {
      try {
        await tx.insert(orderEvents).values(rows);
      } catch (err) {
        // Control de concurrencia optimista: otro proceso ya escribió esa versión.
        if (isUniqueViolation(err)) throw new ConflictException("La orden fue modificada concurrentemente, reintenta");
        throw err;
      }
      // Misma transacción: eventos y outbox se confirman juntos o no se confirma nada.
      await enqueueOutbox(tx, TOPICS.ORDERS_LIFECYCLE, integrationEvents);
    });
  }
}