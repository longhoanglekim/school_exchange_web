import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { Badge } from '@/components/common/Badge';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { ApiError, mockApi } from '@/lib/services/mockApi';
import type { Campaign, CampaignStats } from '@/lib/types/campaign';
import { useRequireRole } from '@/lib/withRoleGuard';
import { campaignStatusLabel } from '@/lib/utils/post-labels';

type LoadStatus = 'loading' | 'ready' | 'empty' | 'error';

interface CampaignResult {
  campaign: Campaign;
  stats: CampaignStats;
}

export default function CampaignResultsPage() {
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['activity-admin']);
  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [results, setResults] = useState<CampaignResult[]>([]);

  const load = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const campaigns = await mockApi.campaigns.listMyCampaigns();
      const stats = await Promise.all(
        campaigns.map((c) => mockApi.campaigns.getCampaignStats(c.id)),
      );
      setResults(campaigns.map((c, i) => ({ campaign: c, stats: stats[i] })));
      setStatus(campaigns.length > 0 ? 'ready' : 'empty');
    } catch (e) {
      setErrorMessage(
        e instanceof ApiError ? e.message : 'Không thể tải kết quả campaign.',
      );
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    const t = setTimeout(() => { void load(); }, 120);
    return () => clearTimeout(t);
  }, [isAuthorized, load]);

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head>
        <title>Kết quả chiến dịch · School Item Exchange</title>
      </Head>
      <DashboardLayout eyebrow="Quản trị hoạt động" title="Kết quả chiến dịch">
        <PageHead
          eyebrow="Quản trị hoạt động"
          title="Kết quả chiến dịch"
          description="Thống kê kết quả các campaign do bạn quản lý: tổng bài, bài đã duyệt và bài chờ duyệt."
        />

        {status === 'loading' && <LoadingState />}
        {status === 'error' && (
          <ErrorState
            message={errorMessage}
            onRetry={() => { void load(); }}
          />
        )}
        {(status === 'ready' || status === 'empty') && (
          <>
            {results.length === 0 ? (
              <EmptyState message="Chưa có campaign nào để hiển thị kết quả." />
            ) : (
              <div className="results-grid">
                {results.map(({ campaign, stats }) => (
                  <div key={campaign.id} className="result-card">
                    {/* ---- header: name + status ---- */}
                    <div className="result-card-header">
                      <h3 className="result-card-name">{campaign.name}</h3>
                      <Badge status={campaign.status} label={campaignStatusLabel(campaign.status)} />
                    </div>

                    {/* ---- meta line ---- */}
                    <p className="result-card-meta">
                      <span>{campaign.organizer}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={campaign.start}>{campaign.start}</time>
                      <span aria-hidden="true">→</span>
                      <time dateTime={campaign.end}>{campaign.end}</time>
                    </p>

                    {/* ---- description (if any) ---- */}
                    {campaign.description ? (
                      <p className="result-card-desc">{campaign.description}</p>
                    ) : null}

                    {/* ---- stats row ---- */}
                    <div className="result-card-stats">
                      <div className="result-stat">
                        <span className="result-stat-value">{stats.total}</span>
                        <span className="result-stat-label">Tổng số bài</span>
                      </div>
                      <div className="result-stat">
                        <span className="result-stat-value">{stats.approved}</span>
                        <span className="result-stat-label">Đã duyệt</span>
                      </div>
                      <div className="result-stat">
                        <span className="result-stat-value">{stats.pending}</span>
                        <span className="result-stat-label">Chờ duyệt</span>
                      </div>
                    </div>

                    {/* ---- actions ---- */}
                    <div className="result-card-actions">
                      <Link className="btn primary btn-sm" href={`/member/campaigns/${campaign.id}`}>
                        Xem chiến dịch
                      </Link>
                      <Link className="btn secondary btn-sm" href="/activity-admin/campaign-posts">
                        Xem bài đăng
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </DashboardLayout>
    </>
  );
}
