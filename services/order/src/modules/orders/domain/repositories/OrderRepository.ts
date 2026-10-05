import type { Id } from "@marketplace/common";
import type { Order } from "../models/Order.js";

export interface OrderRepository {
  /** Reconstruye la orden a partir de sus eventos. */
  findById(id: Id): Promise<Order | null>;
  /** Agrega los eventos nuevos al event store y al outbox, de forma atómica. */
  save(order: Order): Promise<void>;
}