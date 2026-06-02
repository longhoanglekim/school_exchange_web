import Link from 'next/link';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { formatDate } from '@/lib/utils/formatDate';
import { isImageUrl } from '@/lib/utils/imageUrl';
import { money } from '@/lib/utils/money';
import {
  avatarText,
  categoryLabelVi,
  typeBadgeStatus,
  typeLabel,
} from '@/lib/utils/post-labels';
import type { Post, PostItem } from '@/lib/types/post';

const CONDITION_LABELS: Record<string, string> = {
  new: 'Mới',
  used_good: 'Tốt',
  used_normal: 'Bình thường',
  old: 'Cũ',
};

interface PostCardProps {
  post: Post;
  isOwn: boolean;
  onRequest?: (post: Post) => void;
  onOpenCampaign?: (campaignId: string) => void;
}

// ---- helpers ----

function requestActionLabel(post: Post, isOwn: boolean): string {
  if (isOwn) return 'Bài của bạn';
  if (post.type === 'Sale') return 'Gửi yêu cầu mua';
  if (post.type === 'Exchange') return 'Gửi yêu cầu trao đổi';
  return 'Xin nhận quyên góp';
}

function ItemRow({ item }: { item: PostItem }) {
  return (
    <div className="post-item-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 8 }}>
      {isImageUrl(item.imageName) ? (
        <img
          src={item.imageName}
          alt={item.name}
          style={{ width: 60, height: 48, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 60, height: 48, borderRadius: 6, flexShrink: 0,
          background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 2, fontSize: 12 }}>
          <span style={{ color: 'var(--text-muted)' }}>{categoryLabelVi(item.category)}</span>
          <Badge
            status={item.condition === 'new' ? 'approved' : item.condition === 'old' ? 'rejected' : 'pending-approval'}
            label={CONDITION_LABELS[item.condition] || item.condition}
          />
          {item.price > 0 ? <span className="price-chip" style={{ fontSize: 12 }}>{money(item.price)}</span> : null}
        </div>
      </div>
    </div>
  );
}

// ---- component ----

export function PostCard({ post, isOwn, onRequest, onOpenCampaign }: PostCardProps) {
  const canRequest = !isOwn && post.status === 'Approved';

  const items = post.items && post.items.length > 0 ? post.items : [];

  return (
    <article className={`post-card ${post.campaignId ? 'campaign-post' : ''}`}>
      {/* ---- header: avatar + name + role/date + kind badge ---- */}
      <header className="post-header">
        <div className="avatar post-avatar">{avatarText(post.owner)}</div>
        <div className="post-author">
          <strong>{post.owner}</strong>
          <span>
            {post.ownerRole} · {formatDate(post.date)}
          </span>
        </div>
        <span className={`post-kind${post.campaignId ? ' post-kind-campaign' : ''}`}>
          {post.campaignId ? 'Chiến dịch' : 'Bài thường'}
        </span>
      </header>

      {/* ---- campaign tag (if any) ---- */}
      {post.campaignId ? (
        onOpenCampaign ? (
          <button
            type="button"
            className="campaign-tag"
            onClick={() => onOpenCampaign(post.campaignId!)}
          >
            <svg className="campaign-tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
            <span>Chiến dịch</span>
            {post.campaignName}
          </button>
        ) : (
          <Link
            className="campaign-tag"
            href={`/member/campaigns/${post.campaignId}`}
          >
            <svg className="campaign-tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
            </svg>
            <span>Chiến dịch</span>
            {post.campaignName}
          </Link>
        )
      ) : null}

      {/* ---- content ---- */}
      <div className="post-copy">
        <p>{post.content || post.description || post.title}</p>
      </div>

      {/* ---- items list ---- */}
      {items.length > 0 && (
        <div className="post-items">
          {items.map((item, i) => (
            <ItemRow key={i} item={item} />
          ))}
        </div>
      )}

      {/* ---- metadata: type badge + price + category ---- */}
      <div className="post-meta-row" style={{ marginTop: items.length > 0 ? 10 : 0 }}>
        <Badge status={typeBadgeStatus(post.type)} label={typeLabel(post.type)} />
        {post.category ? (
          <span className="post-category">{categoryLabelVi(post.category)}</span>
        ) : null}
      </div>

      {/* ---- actions ---- */}
      <footer className="post-actions">
        <Link className="post-btn post-btn-detail" href={`/products/${post.id}`}>
          Xem chi tiết
        </Link>
        {isOwn ? (
          <Link className="post-btn post-btn-edit" href={`/member/create-post?edit=${post.id}`}>
            Chỉnh sửa bài
          </Link>
        ) : (
          <Button
            variant={canRequest ? 'primary' : 'secondary'}
            disabled={!canRequest}
            onClick={() => onRequest?.(post)}
          >
            {requestActionLabel(post, isOwn)}
          </Button>
        )}
      </footer>
    </article>
  );
}
