import type { OrderPrimitives } from "../../domain/models/OrderPrimitives.js";

export interface PlaceOrderLineDto {
  productId: string;
  quantity: number;
}

export interface PlaceOrderDto {
  lines: PlaceOrderLineDto[];
}

export type OrderResponseDto = OrderPrimitives;