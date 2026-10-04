import { ValidationException } from "@marketplace/common";

export const PRODUCT_CONDITIONS = ["NEW", "USED"] as const;
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export function parseProductCondition(value: string): ProductCondition {
  if (!(PRODUCT_CONDITIONS as readonly string[]).includes(value)) {
    throw new ValidationException(`Condición inválida. Valores permitidos: ${PRODUCT_CONDITIONS.join(", ")}`);
  }
  return value as ProductCondition;
}