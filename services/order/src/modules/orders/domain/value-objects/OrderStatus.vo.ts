export const ORDER_STATUSES = ["CREATED", "CONFIRMED", "REJECTED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];