import { z } from "zod";

export const registerSchema = z.object({
  email: z.string(),
  password: z.string(),
  roles: z.array(z.string()).optional(),
});

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});