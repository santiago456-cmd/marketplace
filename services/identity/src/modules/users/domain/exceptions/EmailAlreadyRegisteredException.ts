// EmailAlreadyRegisteredException.ts
import { ConflictException } from "@marketplace/common";

export class EmailAlreadyRegisteredException extends ConflictException {
  constructor() {
    super("El email ya está registrado");
  }
}