import { BusinessRuleException } from "@marketplace/common";

export class InsufficientStockException extends BusinessRuleException {
  constructor(productId: string, requested: number, available: number) {
    super(`Stock insuficiente para el producto ${productId}: solicitado ${requested}, disponible ${available}`);
  }
}