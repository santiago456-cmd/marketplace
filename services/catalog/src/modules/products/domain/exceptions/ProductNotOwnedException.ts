import { ForbiddenException } from "../../../../@shared/domain/exceptions/DomainException.js";

export class ProductNotOwnedException extends ForbiddenException {
  constructor(productId: string) {
    super(`No eres el dueño del producto ${productId}`);
  }
}