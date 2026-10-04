import { ValidationException } from "../exceptions/DomainException.js";

export class DateValue {
  private constructor(private readonly date: Date) {}

  static now(): DateValue {
    return new DateValue(new Date());
  }

  static from(input: Date | string): DateValue {
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) throw new ValidationException(`Fecha inválida: ${input}`);
    return new DateValue(date);
  }

  toDate(): Date {
    return new Date(this.date);
  }

  toISOString(): string {
    return this.date.toISOString();
  }
}