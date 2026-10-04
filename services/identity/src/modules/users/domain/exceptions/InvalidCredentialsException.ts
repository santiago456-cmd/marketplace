// InvalidCredentialsException.ts
import { UnauthorizedException } from "@marketplace/common";

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super("Credenciales inválidas");
  }
}