// ============================================================================
// PaymentGateway.ts — Strategy interface for payment processing.
//
// Each payment method (Simulated, VNPay, MoMo, ZaloPay) implements this
// interface. The checkout page calls through this abstraction so that
// swapping or adding a real gateway requires no UI changes.
// ============================================================================

import type { CheckoutSession, PaymentResult } from '@/lib/types/payment';

export interface PaymentGateway {
  /** Unique identifier matching the PaymentMethod union type. */
  readonly method: string;

  /** Human-readable label shown in the payment method selector. */
  readonly label: string;

  /** Short description shown below the label (e.g. "Thanh toán giả lập — dùng trong môi trường test"). */
  readonly description: string;

  /**
   * Fetch checkout information for a given request.
   * Called when the checkout page loads.
   */
  checkout(requestId: string): Promise<CheckoutSession>;

  /**
   * Confirm / execute the payment.
   * Called when the user clicks "Xác nhận thanh toán".
   */
  confirm(requestId: string): Promise<PaymentResult>;
}
