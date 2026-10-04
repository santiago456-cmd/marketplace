export abstract class DomainException extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationException extends DomainException {
  readonly code = "VALIDATION_ERROR";
}
export class NotFoundException extends DomainException {
  readonly code = "NOT_FOUND";
}
export class ConflictException extends DomainException {
  readonly code = "CONFLICT";
}
export class BusinessRuleException extends DomainException {
  readonly code = "BUSINESS_RULE_VIOLATION";
}
export class UnauthorizedException extends DomainException {
  readonly code = "UNAUTHORIZED";
}
export class ForbiddenException extends DomainException {
  readonly code = "FORBIDDEN";
}