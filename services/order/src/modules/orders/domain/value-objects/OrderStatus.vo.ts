export const ORDER_STATUSES = ["CREATED", "CONFIRMED", "REJECTED", "PAID", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];