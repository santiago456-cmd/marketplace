import { ValidationException } from "@marketplace/common";

export const ROLES = ["BUYER", "SELLER"] as const;
export type Role = (typeof ROLES)[number];

export function parseRoles(values: readonly string[]): Role[] {
  const unique = [...new Set(values)];
  if (unique.length === 0) throw new ValidationException("Debe haber al menos un rol");
  for (const v of unique) {
    if (!(ROLES as readonly string[]).includes(v)) {
      throw new ValidationException(`Rol inválido: ${v}. Valores permitidos: ${ROLES.join(", ")}`);
    }
  }
  return unique as Role[];
}