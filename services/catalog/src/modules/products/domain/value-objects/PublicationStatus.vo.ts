import { ValidationException } from "../../../../@shared/domain/exceptions/DomainException.js";

export const PUBLICATION_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "SUSPENDED"] as const;
export type PublicationStatus = (typeof PUBLICATION_STATUSES)[number];

export function parsePublicationStatus(value: string): PublicationStatus {
  if (!(PUBLICATION_STATUSES as readonly string[]).includes(value)) {
    throw new ValidationException(`Estado de publicación inválido: ${value}`);
  }
  return value as PublicationStatus;
}