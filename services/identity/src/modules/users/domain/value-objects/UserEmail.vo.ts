import { ValidationException } from "@marketplace/common";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserEmail {
  private constructor(readonly value: string) {}

  static from(raw: string): UserEmail {
    const value = raw.trim().toLowerCase();
    if (value.length > 254 || !EMAIL_RE.test(value)) throw new ValidationException("Email inválido");
    return new UserEmail(value);
  }
}