import { Button } from '@/components/common/Button';
import type { ProductRequest } from '@/lib/types/request';

interface RequestActionsProps {
  request: ProductRequest;
  onAccept: () => Promise<void>;
  onReject: () => Promise<void>;
  onComplete: () => Promise<void>;
}

export function RequestActions({
  request,
  onAccept,
  onReject,
  onComplete,
}: RequestActionsProps) {
  // Debug: log the actual status value
  if (typeof window !== 'undefined') {
    console.log('[RequestActions] status:', JSON.stringify(request.status), 'type:', request.type);
  }

  if (request.status === 'Pending' || request.status === 'Pending Approval') {
    return (
      <div className="row" style={{ gap: 8 }}>
        <Button variant="secondary" onClick={() => void onAccept()}>
          Chấp nhận
        </Button>
        <Button variant="secondary" onClick={() => void onReject()}>
          Từ chối
        </Button>
      </div>
    );
  }

  if (request.status === 'Accepted') {
    // For Purchase: buyer must pay, seller cannot complete directly
    if (request.type === 'Purchase') {
      return <span className="small muted">Chờ người mua thanh toán</span>;
    }
    return (
      <Button variant="primary" onClick={() => void onComplete()}>
        Hoàn tất
      </Button>
    );
  }

  return <span className="small muted">Không còn thao tác</span>;
}
