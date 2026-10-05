import { ValidationException } from "@marketplace/common";

export const MAX_QUANTITY_PER_LINE = 100;

export class Quantity {
  private constructor(readonly value: number) {}

  static from(quantity: number): Quantity {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new ValidationException(`La cantidad debe ser un entero entre 1 y ${MAX_QUANTITY_PER_LINE}`);
    }
    return new Quantity(quantity);
  }
}