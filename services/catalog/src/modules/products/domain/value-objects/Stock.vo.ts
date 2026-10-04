import { ValidationException } from "../../../../@shared/domain/exceptions/DomainException.js";

export class Stock {
  private constructor(readonly value: number) {}

  static from(quantity: number): Stock {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new ValidationException("El stock debe ser un entero >= 0");
    }
    return new Stock(quantity);
  }

  isEmpty(): boolean {
    return this.value === 0;
  }

  equals(other: Stock): boolean {
    return this.value === other.value;
  }
}