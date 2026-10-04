import type { Id } from "@marketplace/common";
import type { User } from "../models/User.js";
import type { UserEmail } from "../value-objects/UserEmail.vo.js";

export interface UserRepository {
  findById(id: Id): Promise<User | null>;
  findByEmail(email: UserEmail): Promise<User | null>;
  /** Lanza EmailAlreadyRegisteredException si el email ya existe. */
  save(user: User): Promise<void>;
}