import type { ReservationLine, ReservationOutcome } from "../services/StockReservation.js";

export type ReleaseOutcome = "RELEASED" | "ALREADY_RELEASED" | "NOTHING_TO_RELEASE";

export interface StockReservationRepository {
  /**
   * Reserva atómica (todo o nada) e idempotente por orderId.
   * Devuelve null si esa orden ya había sido procesada (evento duplicado).
   */
  reserve(orderId: string, lines: ReservationLine[]): Promise<ReservationOutcome | null>;

  /** Repone el stock de una orden cancelada. Idempotente: solo repone si la reserva está RESERVED. */
  release(orderId: string): Promise<ReleaseOutcome>;
}