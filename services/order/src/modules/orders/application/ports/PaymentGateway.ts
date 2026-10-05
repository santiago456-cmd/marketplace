export type PaymentResult = { approved: true; paymentId: string } | { approved: false; reason: string };

export interface PaymentGateway {
  /**
   * Cobra el total de la orden. Un rechazo (tarjeta, límite) es un resultado, no una excepción;
   * una excepción significa que no se pudo hablar con el proveedor y se debe reintentar.
   * El orderId actúa como clave de idempotencia: cobrar dos veces la misma orden no duplica el cargo.
   */
  charge(input: { orderId: string; amount: { amount: number; currency: string } }): Promise<PaymentResult>;
}