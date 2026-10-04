// UserNotFoundException.ts
import { NotFoundException } from "@marketplace/common";

export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`Usuario no encontrado: ${userId}`);
  }
}