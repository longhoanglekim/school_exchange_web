// ============================================================================
// lib/payment/index.ts — Barrel export for the Payment Gateway strategy.
//
// Usage in pages/components:
//   import { paymentGateway } from '@/lib/payment';
//   const session = await paymentGateway.checkout(requestId);
//
// To swap to a real gateway later, change the resolvedGateway below.
// All available gateways are exported so the PaymentMethodSelector can
// list them without knowing which one is active.
// ============================================================================

export type { PaymentGateway } from './PaymentGateway';
export { simulatedGateway, SimulatedGateway } from './SimulatedGateway';

// Registry of all available gateways (shown in the selector UI).
import { simulatedGateway } from './SimulatedGateway';

export const availableGateways = [simulatedGateway];

// Active gateway — change this to switch between simulated / real gateways.
// Later: resolve based on env var or user selection.
export const paymentGateway = simulatedGateway;
