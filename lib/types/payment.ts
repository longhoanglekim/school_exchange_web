// ============================================================================
// payment.ts — Payment-related types shared across the checkout UI,
// payment gateway strategies, and API client.
// ============================================================================

export type PaymentMethod = 'simulated' | 'vnpay' | 'momo' | 'zalopay';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';

/** Data returned by GET /api/payments/checkout/:requestId */
export interface CheckoutSession {
  requestId: string;
  productName: string;
  productPrice: number;
  fee: number;            // platform fee (5% of product price)
  total: number;          // what the buyer pays (= productPrice, fee is deducted from seller)
  sellerReceives: number; // what the seller gets (= productPrice - fee)
  paymentMethods: PaymentMethod[];
  buyerName: string;
  sellerName: string;
}

/** Data returned by POST /api/payments/confirm/:requestId */
export interface PaymentResult {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  fee: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  productName?: string;
  buyerName?: string;
  sellerName?: string;
}
