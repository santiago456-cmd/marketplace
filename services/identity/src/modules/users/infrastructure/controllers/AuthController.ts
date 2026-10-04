import { readAuthUser } from "@marketplace/contracts";
import type { FastifyReply, FastifyRequest } from "fastify";
import { UnauthorizedException } from "../../../../@shared/domain/exceptions/DomainException.js";
import type { GetCurrentUserUseCase } from "../../application/use-cases/GetCurrentUserUseCase.js";
import type { LoginUseCase } from "../../application/use-cases/LoginUseCase.js";
import type { RegisterUserUseCase } from "../../application/use-cases/RegisterUserUseCase.js";
import { loginSchema, registerSchema } from "./auth.schemas.js";

export interface UserUseCases {
  register: RegisterUserUseCase;
  login: LoginUseCase;
  getCurrent: GetCurrentUserUseCase;
}

export class AuthController {
  constructor(private readonly useCases: UserUseCases) {}

  register = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = await this.useCases.register.execute(registerSchema.parse(req.body));
    return reply.status(201).send(user);
  };

  login = async (req: FastifyRequest) => {
    return this.useCases.login.execute(loginSchema.parse(req.body));
  };

  /** La identidad la deja el Gateway en los headers; sin ellos no hay sesión. */
  me = async (req: FastifyRequest) => {
    const authUser = readAuthUser(req.headers);
    if (!authUser) throw new UnauthorizedException("Identidad no provista: accede a través del gateway");
    return this.useCases.getCurrent.execute(authUser.userId);
  };
}