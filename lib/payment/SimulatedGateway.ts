// ============================================================================
// SimulatedGateway.ts — Simulated payment gateway implementation.
//
// Used for development and testing. Always succeeds — no real money moves.
// Replace with VNPayGateway, MoMoGateway, etc. for production by changing
// the resolved gateway in lib/payment/index.ts.
// ============================================================================

import type { PaymentGateway } from './PaymentGateway';
import type { CheckoutSession, PaymentResult } from '@/lib/types/payment';
import { mockApi } from '@/lib/services/mockApi';

export class SimulatedGateway implements PaymentGateway {
  readonly method = 'simulated';
  readonly label = 'Thanh toán giả lập';
  readonly description = 'Dùng trong môi trường test — giao dịch luôn thành công.';

  async checkout(requestId: string): Promise<CheckoutSession> {
    return mockApi.payments.checkout(requestId);
  }

  async confirm(requestId: string): Promise<PaymentResult> {
    return mockApi.payments.confirm(requestId, this.method);
  }
}

export const simulatedGateway = new SimulatedGateway();
