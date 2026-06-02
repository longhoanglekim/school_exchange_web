import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { RequestModal } from '@/components/feed/RequestModal';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useAuth } from '@/lib/auth-context';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { Post } from '@/lib/types/post';
import { isImageUrl } from '@/lib/utils/imageUrl';
import { money } from '@/lib/utils/money';
import { useRequireRole } from '@/lib/withRoleGuard';
import { useToast } from '@/components/common/Toast';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

function typeLabel(type: Post['type']): string {
  if (type === 'Sale') {
    return 'Bán lại';
  }
  if (type === 'Exchange') {
    return 'Trao đổi';
  }
  return 'Quyên góp';
}

function avatarText(name: string): string {
  const tokens = String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2);
  return tokens.map((token) => token[0]?.toUpperCase() ?? '').join('') || 'U';
}

function displayPrice(post: Post): string {
  if (post.type === 'Sale') {
    return money(post.price);
  }
  return typeLabel(post.type);
}

export default function PostDetailPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member', 'system-admin', 'activity-admin']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [post, setPost] = useState<Post | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);

  const postId = useMemo(() => {
    const id = router.query.id;
    return typeof id === 'string' ? id : undefined;
  }, [router.query.id]);

  const loadPost = useCallback(async () => {
    if (!postId) {
      return;
    }

    setStatus('loading');
    setErrorMessage('');
    try {
      const detail = await mockApi.posts.getPost(postId);
      setPost(detail);
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Không thể tải chi tiết bài đăng.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, [postId]);

  useEffect(() => {
    if (!isAuthorized || !postId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadPost();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isAuthorized, postId, loadPost]);

  const isOwnPost = post?.owner === session?.userName;
  const canRequest = Boolean(post && !isOwnPost && post.status === 'Approved');

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Post Detail · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Post Detail">
        <PageHead
          eyebrow="School Feed"
          title="Post Detail"
          description="Chi tiết bài đăng với nội dung feed, campaign tag và request modal."
        />

        {status === 'loading' ? <LoadingState message="Đang tải chi tiết bài đăng..." /> : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải chi tiết bài đăng.'}
            onRetry={() => {
              void loadPost();
            }}
          />
        ) : null}

        {status === 'empty' ? <EmptyState message="Không tìm thấy bài đăng." /> : null}

        {status === 'ready' && post ? (
          <article className="post-card post-detail-card">
            <header className="post-header">
              <div className="avatar post-avatar">{avatarText(post.owner)}</div>
              <div className="post-author">
                <strong>{post.owner}</strong>
                <span>
                  {post.ownerRole} · {post.date}
                </span>
              </div>
              <div className="post-kind">
                {post.campaignId ? (
                  <Link className="campaign-tag" href={`/member/campaigns/${post.campaignId}`}>
                    <span>Campaign</span>
                    {post.campaignName}
                  </Link>
                ) : (
                  'Normal Post'
                )}
              </div>
            </header>

            <div className="post-copy">
              <p>{post.content || post.description || post.title}</p>
            </div>

            {/* ---- Items list ---- */}
            {post.items && post.items.length > 0 && (
              <div className="stack" style={{ gap: 12 }}>
                {post.items.map((item, i) => (
                  <div key={i} className="card" style={{ padding: 12, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      {isImageUrl(item.imageName) ? (
                        <img
                          src={item.imageName}
                          alt={item.name}
                          style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 120, height: 90, borderRadius: 8, flexShrink: 0,
                          background: 'var(--bg-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity={0.4}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <strong>{item.name}</strong>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4, fontSize: 13 }}>
                          <span>{item.category}</span>
                          <Badge
                            status={item.condition === 'new' ? 'approved' : item.condition === 'old' ? 'rejected' : 'pending-approval'}
                            label={item.condition === 'new' ? 'Mới' : item.condition === 'used_good' ? 'Tốt' : item.condition === 'used_normal' ? 'Bình thường' : 'Cũ'}
                          />
                          {item.price > 0 ? <span className="price-chip">{money(item.price)}</span> : null}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="post-meta-row">
              <Badge status={post.type.toLowerCase()} label={typeLabel(post.type)} />
              <span className="price-chip">{displayPrice(post)}</span>
              <span>{post.category}</span>
            </div>

            <div className="card stack">
              <h3>{post.title}</h3>
              <p>{post.description}</p>
            </div>

            <footer className="post-actions">
              <Link className="btn secondary" href="/member/feed">
                Quay lại School Feed
              </Link>
              <Button
                variant="primary"
                disabled={!canRequest}
                onClick={() => setRequestOpen(true)}
              >
                {isOwnPost
                  ? 'Bài của bạn'
                  : post.type === 'Sale'
                    ? 'Gửi yêu cầu mua'
                    : post.type === 'Exchange'
                      ? 'Gửi yêu cầu trao đổi'
                      : 'Xin nhận quyên góp'}
              </Button>
            </footer>

            <RequestModal
              open={requestOpen}
              post={post}
              onClose={() => setRequestOpen(false)}
              onSubmit={async (message, contact) => {
                try {
                  await mockApi.requests.sendRequest(post.id, message, contact);
                  show('Đã gửi yêu cầu. Chủ bài đăng sẽ thấy trong My Requests.', 'success');
                } catch (error) {
                  const errorText =
                    error instanceof ApiError
                      ? error.message
                      : 'Không thể gửi yêu cầu. Vui lòng thử lại.';
                  show(errorText, 'error');
                  throw error;
                }
              }}
            />
          </article>
        ) : null}
      </DashboardLayout>
    </>
  );
}
