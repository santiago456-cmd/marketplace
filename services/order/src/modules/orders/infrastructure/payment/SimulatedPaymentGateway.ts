import { setTimeout as sleep } from "node:timers/promises";
import type { PaymentGateway, PaymentResult } from "../../application/ports/PaymentGateway.js";

/** Pasarela de mentira: rechaza los totales que superen un límite, y es determinística. */
export class SimulatedPaymentGateway implements PaymentGateway {
  constructor(private readonly limitAmount: number) {}

  async charge(input: { orderId: string; amount: { amount: number; currency: string } }): Promise<PaymentResult> {
    await sleep(150); // latencia de red simulada

    if (input.amount.amount > this.limitAmount) {
      return {
        approved: false,
        reason: `el monto supera el límite de la tarjeta simulada (${this.limitAmount} centavos)`,
      };
    }
    return { approved: true, paymentId: `sim_${input.orderId}` };
  }
}