// OrderNotFoundException.ts
import { NotFoundException } from "@marketplace/common";

export class OrderNotFoundException extends NotFoundException {
  constructor(orderId: string) {
    super(`Orden no encontrada: ${orderId}`);
  }
}