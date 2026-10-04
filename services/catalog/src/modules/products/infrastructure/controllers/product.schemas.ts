import { z } from "zod";

const money = z.object({ amount: z.number(), currency: z.string() });

export const idParamsSchema = z.object({ id: z.string() });

export const createProductSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  categoryId: z.string(),
  price: money,
  stock: z.number(),
  condition: z.string(),
});

export const updatePriceSchema = money;
export const updateStockSchema = z.object({ stock: z.number() });