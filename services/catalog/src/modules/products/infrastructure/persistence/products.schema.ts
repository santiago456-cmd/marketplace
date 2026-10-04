import { bigint, char, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey(),
    sellerId: uuid("seller_id").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    categoryId: text("category_id").notNull(),
    priceAmount: bigint("price_amount", { mode: "number" }).notNull(),
    priceCurrency: char("price_currency", { length: 3 }).notNull(),
    stock: integer("stock").notNull(),
    condition: text("condition").notNull(),
    status: text("status").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    version: integer("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("products_seller_idx").on(t.sellerId)],
);