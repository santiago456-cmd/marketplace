import { eq } from "drizzle-orm";
import type { Id } from "@marketplace/common";
import type { Db } from "../../../../@shared/infrastructure/database/db.js";
import { EmailAlreadyRegisteredException } from "../../domain/exceptions/EmailAlreadyRegisteredException.js";
import type { User } from "../../domain/models/User.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import type { UserEmail } from "../../domain/value-objects/UserEmail.vo.js";
import { UserMapper } from "../mappers/UserMapper.js";
import { users } from "./users.schema.js";

/** Drizzle envuelve el error de pg: el código puede venir en err o en err.cause. */
const isUniqueViolation = (err: unknown): boolean => {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
};

export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: Db) {}

  async findById(id: Id): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, id.value)).limit(1);
    return row ? UserMapper.toDomain(row) : null;
  }

  async findByEmail(email: UserEmail): Promise<User | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email.value)).limit(1);
    return row ? UserMapper.toDomain(row) : null;
  }

  /** Por ahora solo inserta: no hay casos de uso que modifiquen usuarios. */
  async save(user: User): Promise<void> {
    try {
      await this.db.insert(users).values(UserMapper.toRow(user));
    } catch (err) {
      if (isUniqueViolation(err)) throw new EmailAlreadyRegisteredException();
      throw err;
    }
  }
}