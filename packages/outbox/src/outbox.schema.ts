import { sql } from "drizzle-orm";
import { bigserial, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const outbox = pgTable(
  "outbox",
  {
    id: uuid("id").primaryKey(), // = eventId
    seq: bigserial("seq", { mode: "number" }).notNull(), // orden de inserción
    topic: text("topic").notNull(),
    key: text("key").notNull(), // key de Kafka (aggregateId)
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (t) => [index("outbox_pending_idx").on(t.seq).where(sql`${t.publishedAt} is null`)],
);