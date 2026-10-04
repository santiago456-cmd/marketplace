// PasswordHasher.ts
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  verify(plain: string, storedHash: string): Promise<boolean>;
}