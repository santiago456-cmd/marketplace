// EmailAlreadyRegisteredException.ts
import { ConflictException } from "../../../../@shared/domain/exceptions/DomainException.js";

export class EmailAlreadyRegisteredException extends ConflictException {
  constructor() {
    super("El email ya está registrado");
  }
}