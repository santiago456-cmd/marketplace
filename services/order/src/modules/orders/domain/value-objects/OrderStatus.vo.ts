export const ORDER_STATUSES = ["CREATED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];