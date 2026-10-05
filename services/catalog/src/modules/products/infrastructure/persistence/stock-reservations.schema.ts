import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const stockReservations = pgTable("stock_reservations", {
  orderId: uuid("order_id").primaryKey(),
  status: text("status").notNull(), // PENDING (solo dentro de la transacción) | RESERVED | REJECTED
  reason: text("reason"),
  lines: jsonb("lines").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});