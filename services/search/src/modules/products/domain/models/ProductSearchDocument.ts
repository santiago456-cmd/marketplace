/** Documento de lectura: lo que se indexa en Elasticsearch. */
export interface ProductSearchDocument {
  productId: string;
  sellerId: string;
  name: string;
  description: string;
  categoryId: string;
  price: { amount: number; currency: string };
  stock: number;
  condition: string;
  publishedAt: string;
}