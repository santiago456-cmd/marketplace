import type { Id } from "../../../../@shared/domain/value-objects/Id.vo.js";
import type { Product } from "../models/Product.js";

export interface ProductRepository {
  findById(id: Id): Promise<Product | null>;
  /** Persiste el agregado y sus eventos pendientes de forma atómica. */
  save(product: Product): Promise<void>;
}