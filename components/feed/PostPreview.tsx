import { useWatch } from 'react-hook-form';
import type { Control } from 'react-hook-form';

import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { isImageUrl } from '@/lib/utils/imageUrl';
import { money } from '@/lib/utils/money';
import {
  avatarText,
  categoryLabelVi,
  typeBadgeStatus,
  typeLabel,
} from '@/lib/utils/post-labels';
import type { Campaign } from '@/lib/types/campaign';

const CONDITION_LABELS: Record<string, string> = {
  new: 'Mới',
  used_good: 'Tốt',
  used_normal: 'Bình thường',
  old: 'Cũ',
};

// Inline item type matching form schema output
interface PreviewItem {
  name: string;
  category: string;
  price: number;
  condition: string;
  imageName?: string;
}

interface PostPreviewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  campaigns: Campaign[];
  /** Current items from form state (via useWatch). */
  items?: PreviewItem[];
}

export function PostPreview({ control, campaigns, items }: PostPreviewProps) {
  const watched = useWatch({ control });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const title: string = (watched as any).title ?? '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const content: string = (watched as any).content ?? '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const type: string = (watched as any).type ?? 'Sale';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const campaignId: string = (watched as any).campaignId ?? '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contact: string = (watched as any).contact ?? '';

  const displayItems = items && items.length > 0 ? items : [];

  const hasContent =
    title.trim().length > 0 ||
    content.trim().length > 0 ||
    displayItems.some((item) => item.name.trim().length > 0);

  const selectedCampaign = campaignId
    ? campaigns.find((c) => c.id === campaignId)
    : null;

  if (!hasContent) {
    return (
      <EmptyState message="Bản xem trước sẽ hiển thị khi bạn nhập thông tin bài đăng." />
    );
  }

  const today = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="post-card">
      {/* ---- pending badge ---- */}
      <Badge status="pending-approval" label="Chờ duyệt" />

      {/* ---- header ---- */}
      <header className="post-header">
        <div className="avatar post-avatar">{avatarText('Bạn')}</div>
        <div className="post-author">
          <strong>Bạn (xem trước)</strong>
          <span>Member · {today}</span>
        </div>
        <span className="post-kind">
          {campaignId ? 'Chiến dịch' : 'Bài thường'}
        </span>
      </header>

      {/* ---- campaign tag ---- */}
      {selectedCampaign ? (
        <div className="campaign-tag">
          <span>Chiến dịch</span>
          {selectedCampaign.name}
        </div>
      ) : null}

      {/* ---- content ---- */}
      <div className="post-copy">
        <p>
          {title ? (
            <>
              <strong>{title}</strong>
              {content ? <br /> : null}
            </>
          ) : null}
          {content || 'Chưa có nội dung'}
        </p>
      </div>

      {/* ---- items list ---- */}
      <div className="stack" style={{ gap: 12 }}>
        {displayItems.map((item, i) => (
          <div key={i} className="card" style={{ padding: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              {/* item image */}
              {isImageUrl(item.imageName) ? (
                <img
                  src={item.imageName}
                  alt={item.name || `Sản phẩm ${i + 1}`}
                  style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
                />
              ) : (
                <div
                  style={{
                    width: 80, height: 60, borderRadius: 6, flexShrink: 0,
                    background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              {/* item info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 14 }}>{item.name || `Sản phẩm ${i + 1}`}</strong>
                <div className="post-meta-row" style={{ marginTop: 4, gap: 6, flexWrap: 'wrap' }}>
                  {item.category ? <span className="post-category">{categoryLabelVi(item.category)}</span> : null}
                  <Badge
                    status={item.condition === 'new' ? 'approved' : item.condition === 'old' ? 'rejected' : 'pending-approval'}
                    label={CONDITION_LABELS[item.condition] || item.condition}
                  />
                  {type === 'Sale' && item.price > 0 ? (
                    <span className="price-chip">{money(item.price)}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ---- metadata ---- */}
      <div className="post-meta-row" style={{ marginTop: 12 }}>
        <Badge status={typeBadgeStatus(type)} label={typeLabel(type)} />
        {contact ? <span className="post-category">{contact}</span> : null}
      </div>

      {/* ---- actions (disabled preview) ---- */}
      <footer className="post-actions">
        <span className="btn secondary" style={{ opacity: 0.5, cursor: 'default' }}>
          Xem chi tiết
        </span>
        <span className="btn primary" style={{ opacity: 0.5, cursor: 'default' }}>
          Gửi yêu cầu
        </span>
      </footer>
    </article>
  );
}
