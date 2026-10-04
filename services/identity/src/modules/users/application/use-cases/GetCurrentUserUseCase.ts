import { Id } from "../../../../@shared/domain/value-objects/Id.vo.js";
import { UserNotFoundException } from "../../domain/exceptions/UserNotFoundException.js";
import type { UserRepository } from "../../domain/repositories/UserRepository.js";
import { type UserResponseDto, toUserResponse } from "../dtos/UserDto.js";

export class GetCurrentUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<UserResponseDto> {
    const user = await this.users.findById(Id.from(userId));
    if (!user) throw new UserNotFoundException(userId);
    return toUserResponse(user.toPrimitives());
  }
}