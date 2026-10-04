import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).optional(),
  categoryId: z.string().optional(),
  condition: z.enum(["NEW", "USED"]).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  inStock: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest"]).default("relevance"),
  page: z.coerce.number().int().min(1).max(200).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20), // 200 × 50 = 10.000, el límite de ES
});