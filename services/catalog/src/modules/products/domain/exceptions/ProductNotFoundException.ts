import { NotFoundException } from "@marketplace/common";

export class ProductNotFoundException extends NotFoundException {
  constructor(productId: string) {
    super(`Producto no encontrado: ${productId}`);
  }
}