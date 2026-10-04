/** Foto del producto: es el payload de los eventos ProductCreated/ProductPublished. */
export interface ProductSnapshot {
  productId: string;
  sellerId: string;
  name: string;
  description: string;
  categoryId: string;
  price: { amount: number; currency: string };
  stock: number;
  condition: string;
  status: string;
}

export interface ProductPrimitives extends ProductSnapshot {
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}