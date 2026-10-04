import { ValidationException } from "@marketplace/common";

export class ProductName {
  private constructor(readonly value: string) {}

  static from(raw: string): ProductName {
    const value = raw.trim();
    if (value.length < 3 || value.length > 120) {
      throw new ValidationException("El nombre del producto debe tener entre 3 y 120 caracteres");
    }
    return new ProductName(value);
  }
}