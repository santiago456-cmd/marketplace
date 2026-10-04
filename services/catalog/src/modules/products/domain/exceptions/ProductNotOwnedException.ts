import { ForbiddenException } from "@marketplace/common";

export class ProductNotOwnedException extends ForbiddenException {
  constructor(productId: string) {
    super(`No eres el dueño del producto ${productId}`);
  }
}