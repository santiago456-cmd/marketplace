import { ValidationException } from "@marketplace/common";

/** Monto en unidades menores (centavos) para evitar errores de punto flotante. */
export class Price {
  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  static from(amount: number, currency: string): Price {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new ValidationException("El precio debe ser un entero >= 0 (en centavos)");
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new ValidationException("La moneda debe ser un código ISO de 3 letras mayúsculas (ej: ARS)");
    }
    return new Price(amount, currency);
  }

  equals(other: Price): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}