import type { ProductPrimitives } from "../../domain/models/ProductPrimitives.js";

export interface MoneyDto {
  amount: number;
  currency: string;
}

export interface CreateProductDto {
  sellerId: string;
  name: string;
  description?: string;
  categoryId: string;
  price: MoneyDto;
  stock: number;
  condition: string;
}

/** La versión (bloqueo optimista) es un detalle interno, no se expone. */
export type ProductResponseDto = Omit<ProductPrimitives, "version">;

export const toProductResponse = ({ version: _version, ...dto }: ProductPrimitives): ProductResponseDto => dto;