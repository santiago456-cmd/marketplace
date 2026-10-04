import type { UserPrimitives } from "../../domain/models/UserPrimitives.js";

export interface RegisterUserDto {
  email: string;
  password: string;
  roles?: string[];
}

export interface LoginDto {
  email: string;
  password: string;
}

/** El hash de la contraseña nunca sale del servicio. */
export type UserResponseDto = Omit<UserPrimitives, "passwordHash">;

export const toUserResponse = ({ passwordHash: _hash, ...dto }: UserPrimitives): UserResponseDto => dto;

export interface LoginResponseDto {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: UserResponseDto;
}