import { InvalidCredentialsException } from "../../domain/exceptions/InvalidCredentialsException.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import { UserEmail } from "../../domain/value-objects/UserEmail.vo.js";
import { type LoginDto, type LoginResponseDto, toUserResponse } from "../dtos/UserDto.js";
import type { PasswordHasher } from "../ports/PasswordHasher.js";
import type { TokenIssuer } from "../ports/TokenIssuer.js";

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenIssuer,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users.findByEmail(UserEmail.from(dto.email));
    const valid = user ? await this.hasher.verify(dto.password, user.passwordHash) : false;
    // Mismo error para "no existe" y "contraseña incorrecta": no revela qué emails están registrados.
    if (!user || !valid) throw new InvalidCredentialsException();

    const { token, expiresIn } = await this.tokens.issue({
      userId: user.id,
      email: user.email,
      roles: user.roles,
    });
    return {
      accessToken: token,
      tokenType: "Bearer",
      expiresIn,
      user: toUserResponse(user.toPrimitives()),
    };
  }
}