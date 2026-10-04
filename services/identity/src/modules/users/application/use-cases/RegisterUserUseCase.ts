import { User } from "../../domain/models/User.js";
import { EmailAlreadyRegisteredException } from "../../domain/exceptions/EmailAlreadyRegisteredException.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import { parseRoles } from "../../domain/value-objects/Role.vo.js";
import { UserEmail } from "../../domain/value-objects/UserEmail.vo.js";
import { UserPassword } from "../../domain/value-objects/UserPassword.vo.js";
import { type RegisterUserDto, type UserResponseDto, toUserResponse } from "../dtos/UserDto.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";

export class RegisterUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(dto: RegisterUserDto): Promise<UserResponseDto> {
    const email = UserEmail.from(dto.email);
    const password = UserPassword.from(dto.password);
    const roles = parseRoles(dto.roles ?? ["BUYER"]);

    if (await this.users.findByEmail(email)) throw new EmailAlreadyRegisteredException();

    const user = User.register({ email, passwordHash: await this.hasher.hash(password.value), roles });
    await this.users.save(user); // si dos registros simultáneos pasan el chequeo, el índice único decide
    return toUserResponse(user.toPrimitives());
  }
}