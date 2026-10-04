import {
  type AccessTokenClaims,
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
  accessTokenClaimsSchema,
} from "@marketplace/contracts";
import { jwtVerify } from "jose";

export class JwtVerifier {
  private readonly key: Uint8Array;

  constructor(secret: string) {
    this.key = new TextEncoder().encode(secret);
  }

  /** Lanza si la firma, el emisor, la audiencia o la expiración no son válidos. */
  async verify(token: string): Promise<AccessTokenClaims> {
    const { payload } = await jwtVerify(token, this.key, {
      algorithms: ["HS256"], // fija el algoritmo: evita ataques de confusión de algoritmo
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    });
    return accessTokenClaimsSchema.parse(payload);
  }
}