export const TOPICS = {
  CATALOG_PRODUCTS: "catalog.products",
  ORDERS_LIFECYCLE: "orders.lifecycle",
} as const;

export type Topic = (typeof TOPICS)[keyof typeof TOPICS];