// OrderNotOwnedException.ts
import { ForbiddenException } from "@marketplace/common";

export class OrderNotOwnedException extends ForbiddenException {
  constructor(orderId: string) {
    super(`No eres el dueño de la orden ${orderId}`);
  }
}