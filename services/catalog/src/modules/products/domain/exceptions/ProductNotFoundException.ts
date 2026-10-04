import { NotFoundException } from "../../../../@shared/domain/exceptions/DomainException.js";

export class ProductNotFoundException extends NotFoundException {
  constructor(productId: string) {
    super(`Producto no encontrado: ${productId}`);
  }
}