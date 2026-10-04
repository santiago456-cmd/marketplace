// TokenIssuer.ts
export interface TokenIssuer {
  issue(claims: { userId: string; email: string; roles: string[] }): Promise<{ token: string; expiresIn: number }>;
}