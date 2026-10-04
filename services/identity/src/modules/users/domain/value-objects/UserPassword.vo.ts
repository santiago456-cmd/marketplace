import { ValidationException } from "@marketplace/common";

export class UserPassword {
  private constructor(readonly value: string) {}

  static from(raw: string): UserPassword {
    if (raw.length < 8 || raw.length > 128) {
      throw new ValidationException("La contraseña debe tener entre 8 y 128 caracteres");
    }
    if (!/[A-Za-z]/.test(raw) || !/\d/.test(raw)) {
      throw new ValidationException("La contraseña debe incluir letras y números");
    }
    return new UserPassword(raw);
  }
}