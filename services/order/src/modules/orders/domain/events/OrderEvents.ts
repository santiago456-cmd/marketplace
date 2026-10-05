export interface MoneySnapshot {
  amount: number;
  currency: string;
}

export interface OrderLineSnapshot {
  productId: string;
  sellerId: string;
  name: string;
  unitPrice: MoneySnapshot;
  quantity: number;
}

export type OrderDomainEvent =
  | {
      type: "OrderCreated";
      occurredAt: string;
      orderId: string;
      buyerId: string;
      lines: OrderLineSnapshot[];
      total: MoneySnapshot;
    }
  | { type: "OrderConfirmed"; occurredAt: string; orderId: string }
  | { type: "OrderRejected"; occurredAt: string; orderId: string; reason: string };