import type { OrderCancelledEvent } from "@marketplace/contracts";
import type {
  ReleaseOutcome,
  StockReservationRepository,
} from "../../domain/repositories/StockReservationRepository.js";

export class ReleaseStockUseCase {
  constructor(private readonly reservations: StockReservationRepository) {}

  async execute(event: OrderCancelledEvent): Promise<ReleaseOutcome> {
    return this.reservations.release(event.payload.orderId);
  }
}