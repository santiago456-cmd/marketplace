import { z } from "zod";

export const TOKEN_ISSUER = "marketplace-identity";
export const TOKEN_AUDIENCE = "marketplace";

/** Headers con los que el Gateway reenvía la identidad ya verificada. */
export const AUTH_HEADERS = {
  USER_ID: "x-user-id",
  USER_ROLES: "x-user-roles",
} as const;

export const roleSchema = z.enum(["BUYER", "SELLER"]);
export type Role = z.infer<typeof roleSchema>;

/** Claims del access token. */
export const accessTokenClaimsSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  roles: z.array(roleSchema).min(1),
});
export type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;

export const authUserSchema = z.object({
  userId: z.string().uuid(),
  roles: z.array(roleSchema).min(1),
});
export type AuthUser = z.infer<typeof authUserSchema>;

export const toAuthHeaders = (user: AuthUser): Record<string, string> => ({
  [AUTH_HEADERS.USER_ID]: user.userId,
  [AUTH_HEADERS.USER_ROLES]: user.roles.join(","),
});

type HeaderBag = Record<string, string | string[] | undefined>;

/** Lee la identidad que dejó el Gateway. Devuelve null si falta o es inválida. */
export function readAuthUser(headers: HeaderBag): AuthUser | null {
  const userId = headers[AUTH_HEADERS.USER_ID];
  const roles = headers[AUTH_HEADERS.USER_ROLES];
  if (typeof userId !== "string" || typeof roles !== "string") return null;
  const parsed = authUserSchema.safeParse({ userId, roles: roles.split(",") });
  return parsed.success ? parsed.data : null;
}