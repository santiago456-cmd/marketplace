// UserNotFoundException.ts
import { NotFoundException } from "../../../../@shared/domain/exceptions/DomainException.js";

export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`Usuario no encontrado: ${userId}`);
  }
}