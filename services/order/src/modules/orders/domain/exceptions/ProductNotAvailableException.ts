// ProductNotAvailableException.ts
import { BusinessRuleException } from "@marketplace/common";

export class ProductNotAvailableException extends BusinessRuleException {
  constructor(productId: string) {
    super(`El producto ${productId} no existe o no está disponible para la compra`);
  }
}