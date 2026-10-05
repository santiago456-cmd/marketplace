import { BusinessRuleException, ValidationException } from "@marketplace/common";

/** Monto en unidades menores (centavos). */
export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  static from(amount: number, currency: string): Money {
    if (!Number.isSafeInteger(amount) || amount < 0) {
      throw new ValidationException("El monto debe ser un entero >= 0 (en centavos)");
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new ValidationException("La moneda debe ser un código ISO de 3 letras mayúsculas (ej: ARS)");
    }
    return new Money(amount, currency);
  }

  times(factor: number): Money {
    return Money.from(this.amount * factor, this.currency);
  }

  plus(other: Money): Money {
    if (other.currency !== this.currency) {
      throw new BusinessRuleException("Todos los productos de una orden deben tener la misma moneda");
    }
    return Money.from(this.amount + other.amount, this.currency);
  }

  toPrimitives(): { amount: number; currency: string } {
    return { amount: this.amount, currency: this.currency };
  }
}