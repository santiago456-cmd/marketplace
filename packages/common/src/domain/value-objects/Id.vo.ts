import { randomUUID } from "node:crypto";
import { ValidationException } from "../exceptions/DomainException.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class Id {
  private constructor(readonly value: string) {}

  static generate(): Id {
    return new Id(randomUUID());
  }

  static from(value: string): Id {
    if (!UUID_RE.test(value)) throw new ValidationException(`Id inválido: ${value}`);
    return new Id(value.toLowerCase());
  }

  equals(other: Id): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}