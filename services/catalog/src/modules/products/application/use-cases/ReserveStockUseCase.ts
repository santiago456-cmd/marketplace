import type { OrderCreatedEvent } from "@marketplace/contracts";
import type { StockReservationRepository } from "../../domain/repositories/StockReservationRepository.js";
import type { ReservationOutcome } from "../../domain/services/StockReservation.js";

export class ReserveStockUseCase {
  constructor(private readonly reservations: StockReservationRepository) {}

  /** Devuelve null si el evento ya había sido procesado. */
  async execute(event: OrderCreatedEvent): Promise<ReservationOutcome | null> {
    const { orderId, lines } = event.payload;
    return this.reservations.reserve(
      orderId,
      lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    );
  }
}