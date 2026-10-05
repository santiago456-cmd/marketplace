import { integer, jsonb, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

/** Event store: solo se inserta, nunca se actualiza ni se borra. */
export const orderEvents = pgTable(
  "order_events",
  {
    orderId: uuid("order_id").notNull(),
    version: integer("version").notNull(), // 1, 2, 3... por orden
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.orderId, t.version] })],
);