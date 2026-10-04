import { type ScryptOptions, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { PasswordHasher } from "../../application/ports/PasswordHasher.js";

const KEY_LEN = 64;
const PARAMS = { N: 2 ** 15, r: 8, p: 1 };
const MAXMEM = 128 * 1024 * 1024; // el default de Node (32 MB) no alcanza para N=2^15

const derive = (password: string, salt: Buffer, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LEN, options, (err, key) => (err ? reject(err) : resolve(key)));
  });

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = randomBytes(16);
    const key = await derive(plain, salt, { ...PARAMS, maxmem: MAXMEM });
    return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
  }

  async verify(plain: string, stored: string): Promise<boolean> {
    const [scheme, n, r, p, saltB64, keyB64] = stored.split("$");
    if (scheme !== "scrypt" || !n || !r || !p || !saltB64 || !keyB64) return false;

    const expected = Buffer.from(keyB64, "base64");
    const actual = await derive(plain, Buffer.from(saltB64, "base64"), {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: MAXMEM,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }
}