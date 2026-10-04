// InvalidCredentialsException.ts
import { UnauthorizedException } from "../../../../@shared/domain/exceptions/DomainException.js";

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super("Credenciales inválidas");
  }
}