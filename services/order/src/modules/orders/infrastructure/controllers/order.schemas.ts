import { z } from "zod";

export const idParamsSchema = z.object({ id: z.string() });

export const placeOrderSchema = z.object({
  lines: z
    .array(z.object({ productId: z.string(), quantity: z.number() }))
    .min(1)
    .max(10),
});