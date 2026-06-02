// ============================================================================
// PaymentMethodSelector.tsx — Payment method selection card list.
//
// Renders the list of available payment gateways as selectable cards.
// Currently only "Simulated" is available; slots for VNPay, MoMo, ZaloPay
// are ready — just add them to the `gateways` array.
// ============================================================================

import type { PaymentGateway } from '@/lib/payment';

export interface PaymentMethodSelectorProps {
  gateways: PaymentGateway[];
  selected: string;
  onChange: (method: string) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  gateways,
  selected,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  if (gateways.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 24 }}>
        <p style={{ color: 'var(--text-muted)' }}>Không có phương thức thanh toán nào khả dụng.</p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {gateways.map((gateway) => {
        const isSelected = selected === gateway.method;
        return (
          <label
            key={gateway.method}
            className="card"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: 16,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
              borderRadius: 8,
              transition: 'border-color 0.15s',
            }}
          >
            <input
              type="radio"
              name="paymentMethod"
              value={gateway.method}
              checked={isSelected}
              onChange={() => onChange(gateway.method)}
              disabled={disabled}
              style={{ marginTop: 2, accentColor: 'var(--primary)' }}
            />
            <div style={{ flex: 1 }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>{gateway.label}</strong>
              <small style={{ color: 'var(--text-muted)' }}>{gateway.description}</small>
            </div>
          </label>
        );
      })}
    </div>
  );
}
