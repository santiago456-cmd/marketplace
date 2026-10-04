import { DateValue } from "@marketplace/common";
import { Id } from "@marketplace/common";
import { type Role, parseRoles } from "../value-objects/Role.vo.js";
import { UserEmail } from "../value-objects/UserEmail.vo.js";
import type { UserPrimitives } from "./UserPrimitives.js";

interface UserProps {
  id: Id;
  email: UserEmail;
  passwordHash: string;
  roles: Role[];
  createdAt: DateValue;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static register(input: { email: UserEmail; passwordHash: string; roles: Role[] }): User {
    return new User({ id: Id.generate(), ...input, createdAt: DateValue.now() });
  }

  static reconstitute(p: UserPrimitives): User {
    return new User({
      id: Id.from(p.userId),
      email: UserEmail.from(p.email),
      passwordHash: p.passwordHash,
      roles: parseRoles(p.roles),
      createdAt: DateValue.from(p.createdAt),
    });
  }

  get id(): string {
    return this.props.id.value;
  }
  get email(): string {
    return this.props.email.value;
  }
  get passwordHash(): string {
    return this.props.passwordHash;
  }
  get roles(): Role[] {
    return [...this.props.roles];
  }

  toPrimitives(): UserPrimitives {
    const p = this.props;
    return {
      userId: p.id.value,
      email: p.email.value,
      passwordHash: p.passwordHash,
      roles: [...p.roles],
      createdAt: p.createdAt.toISOString(),
    };
  }
}