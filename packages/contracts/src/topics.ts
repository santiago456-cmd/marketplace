export const TOPICS = {
  CATALOG_PRODUCTS: "catalog.products",
  CATALOG_INVENTORY: "catalog.inventory",
  ORDERS_LIFECYCLE: "orders.lifecycle",
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];