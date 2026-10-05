import type { ReservationLine, ReservationOutcome } from "../services/StockReservation.js";

export interface StockReservationRepository {
  /**
   * Reserva atómica (todo o nada) e idempotente por orderId.
   * Devuelve null si esa orden ya había sido procesada (evento duplicado).
   */
  reserve(orderId: string, lines: ReservationLine[]): Promise<ReservationOutcome | null>;
}