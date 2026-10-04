import { User } from "../../domain/models/User.js";
import type { users } from "../persistence/users.schema.js";

type UserRow = typeof users.$inferSelect;

export const UserMapper = {
  toDomain(row: UserRow): User {
    return User.reconstitute({
      userId: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
      roles: row.roles,
      createdAt: row.createdAt.toISOString(),
    });
  },

  toRow(user: User): UserRow {
    const p = user.toPrimitives();
    return {
      id: p.userId,
      email: p.email,
      passwordHash: p.passwordHash,
      roles: p.roles,
      createdAt: new Date(p.createdAt),
    };
  },
};