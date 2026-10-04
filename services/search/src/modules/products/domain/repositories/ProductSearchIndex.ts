import type { ProductSearchDocument } from "../models/ProductSearchDocument.js";
import type { SearchCriteria, SearchResult } from "../models/SearchCriteria.js";

export interface ProductSearchIndex {
  upsert(doc: ProductSearchDocument): Promise<void>;
  /** No hace nada si el producto no está indexado (p. ej. sigue en DRAFT). */
  updatePrice(productId: string, price: { amount: number; currency: string }): Promise<void>;
  updateStock(productId: string, stock: number): Promise<void>;
  remove(productId: string): Promise<void>;
  search(criteria: SearchCriteria): Promise<SearchResult>;
}