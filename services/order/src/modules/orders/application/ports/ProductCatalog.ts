export interface CatalogProduct {
  productId: string;
  sellerId: string;
  name: string;
  price: { amount: number; currency: string };
  status: string;
  archived: boolean;
}

export interface ProductCatalog {
  /** null si el producto no existe. */
  getProduct(productId: string): Promise<CatalogProduct | null>;
}