import { TOKEN_AUDIENCE, TOKEN_ISSUER, accessTokenClaimsSchema } from "@marketplace/contracts";
import { SignJWT } from "jose";
import type { TokenIssuer } from "../../application/ports/TokenIssuer.js";

export class JoseTokenIssuer implements TokenIssuer {
  private readonly key: Uint8Array;

  constructor(
    secret: string,
    private readonly ttlSeconds: number,
  ) {
    this.key = new TextEncoder().encode(secret);
  }

  async issue(input: { userId: string; email: string; roles: string[] }) {
    const claims = accessTokenClaimsSchema.parse({ sub: input.userId, email: input.email, roles: input.roles });
    const now = Math.floor(Date.now() / 1000);

    const token = await new SignJWT({ email: claims.email, roles: claims.roles })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(claims.sub)
      .setIssuer(TOKEN_ISSUER)
      .setAudience(TOKEN_AUDIENCE)
      .setIssuedAt(now)
      .setExpirationTime(now + this.ttlSeconds)
      .sign(this.key);

    return { token, expiresIn: this.ttlSeconds };
  }
}