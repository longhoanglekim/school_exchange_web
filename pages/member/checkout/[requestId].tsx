import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { useToast } from '@/components/common/Toast';
import { PaymentMethodSelector } from '@/components/checkout/PaymentMethodSelector';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useAuth } from '@/lib/auth-context';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { CheckoutSession, PaymentResult } from '@/lib/types/payment';
import { money } from '@/lib/utils/money';
import { useRequireRole } from '@/lib/withRoleGuard';

type PageStatus = 'loading' | 'ready' | 'error' | 'not_found' | 'success';

export default function CheckoutPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [session_, setSession] = useState<CheckoutSession | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('simulated');
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);

  const requestId = useMemo(() => {
    const id = router.query.requestId;
    return typeof id === 'string' ? id : undefined;
  }, [router.query.requestId]);

  const loadCheckout = useCallback(async () => {
    if (!requestId) return;

    setStatus('loading');
    setErrorMessage('');
    try {
      const data = await mockApi.payments.checkout(requestId);
      setSession(data);
      setStatus('ready');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'NOT_FOUND') {
        setStatus('not_found');
        setErrorMessage(error.message);
      } else {
        const message = error instanceof ApiError ? error.message : 'Không thể tải thông tin thanh toán.';
        setErrorMessage(message);
        setStatus('error');
      }
    }
  }, [requestId]);

  useEffect(() => {
    if (!isAuthorized || !requestId) return;
    const timeout = window.setTimeout(() => { void loadCheckout(); }, 120);
    return () => window.clearTimeout(timeout);
  }, [isAuthorized, requestId, loadCheckout]);

  const handleConfirm = useCallback(async () => {
    if (!requestId) return;
    setConfirming(true);
    try {
      const data = await mockApi.payments.confirm(requestId, selectedMethod);
      setResult(data);
      setStatus('success');
      show('Thanh toán thành công!', 'success');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Thanh toán thất bại. Vui lòng thử lại.';
      show(message, 'error');
    } finally {
      setConfirming(false);
    }
  }, [requestId, selectedMethod, show]);

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head>
        <title>Thanh toán · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Thanh toán">
        <PageHead
          eyebrow="Payment"
          title="Thanh toán"
          description="Xác nhận và hoàn tất thanh toán cho sản phẩm."
        />

        {status === 'loading' && <LoadingState message="Đang tải thông tin thanh toán..." />}

        {status === 'error' && (
          <ErrorState
            message={errorMessage || 'Không thể tải thông tin thanh toán.'}
            onRetry={() => { void loadCheckout(); }}
          />
        )}

        {status === 'not_found' && (
          <EmptyState message={errorMessage || 'Không tìm thấy yêu cầu thanh toán.'} />
        )}

        {status === 'success' && result && (
          <div className="card" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ marginBottom: 8 }}>Thanh toán thành công!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              Giao dịch của bạn đã được ghi nhận. Sản phẩm đã được chuyển sang trạng thái hoàn tất.
            </p>
            <div className="card" style={{ padding: 16, marginBottom: 20, textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Mã giao dịch:</span>
                <strong>#{result.transactionId}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Số tiền:</span>
                <strong>{money(result.amount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Phí nền tảng (5%):</span>
                <strong>{money(result.fee)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>Phương thức:</span>
                <strong>{result.paymentMethod === 'simulated' ? 'Thanh toán giả lập' : result.paymentMethod}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ngày thanh toán:</span>
                <strong>{result.paymentDate}</strong>
              </div>
            </div>
            <div className="stack" style={{ gap: 8, flexDirection: 'row', justifyContent: 'center' }}>
              <Link className="btn primary" href="/member/my-requests">
                Xem giao dịch của tôi
              </Link>
              <Link className="btn secondary" href="/member/feed">
                Quay lại School Feed
              </Link>
            </div>
          </div>
        )}

        {status === 'ready' && session_ && (
          <div className="stack" style={{ gap: 20 }}>
            {/* Order Summary */}
            <div className="card">
              <h3 style={{ marginBottom: 16 }}>Thông tin đơn hàng</h3>
              <div className="stack" style={{ gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sản phẩm:</span>
                  <strong>{session_.productName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Người bán:</span>
                  <strong>{session_.sellerName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Người mua:</span>
                  <strong>{session_.buyerName}</strong>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Giá sản phẩm:</span>
                  <strong>{money(session_.productPrice)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phí nền tảng (5%):</span>
                  <strong style={{ color: 'var(--text-muted)' }}>{money(session_.fee)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Người bán thực nhận:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{money(session_.sellerReceives)}</span>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                  <strong>Bạn thanh toán:</strong>
                  <strong style={{ color: 'var(--primary)' }}>{money(session_.total)}</strong>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Phương thức thanh toán</h3>
              <PaymentMethodSelector
                gateways={[
                  {
                    method: 'simulated',
                    label: 'Thanh toán giả lập',
                    description: 'Dùng trong môi trường test — giao dịch luôn thành công.',
                    checkout: async () => session_,
                    confirm: async () => result!,
                  },
                ]}
                selected={selectedMethod}
                onChange={setSelectedMethod}
                disabled={confirming}
              />
            </div>

            {/* Confirm Button */}
            <Button
              variant="primary"
              onClick={() => { void handleConfirm(); }}
              disabled={confirming}
              style={{ width: '100%', padding: '12px 0', fontSize: 16 }}
            >
              {confirming ? 'Đang xử lý...' : `Xác nhận thanh toán ${money(session_.total)}`}
            </Button>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}
