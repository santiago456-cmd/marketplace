import type { ProductSearchDocument } from "./ProductSearchDocument.js";

export type SortOption = "relevance" | "price_asc" | "price_desc" | "newest";

export interface SearchCriteria {
  text?: string;
  categoryId?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  currency?: string;
  inStock?: boolean;
  sort: SortOption;
  page: number;
  pageSize: number;
}

export interface FacetBucket {
  key: string;
  count: number;
}

export interface SearchResult {
  total: number;
  page: number;
  pageSize: number;
  items: ProductSearchDocument[];
  facets: {
    categories: FacetBucket[];
    conditions: FacetBucket[];
    price: { min: number | null; max: number | null };
  };
}