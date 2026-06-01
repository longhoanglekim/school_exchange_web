import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { useToast } from '@/components/common/Toast';
import { Field } from '@/components/common/Field';
import { Input } from '@/components/common/Input';
import { ApiError, mockApi, type UserProfile } from '@/lib/services/mockApi';
import { useRequireRole } from '@/lib/withRoleGuard';
import { profileSchema, type ProfileInput } from '@/lib/types/schemas';

type LoadStatus = 'loading' | 'ready' | 'error';

const USER_TYPE_LABELS: Record<string, string> = {
  student: 'Học sinh',
  teacher: 'Giáo viên',
  school_staff: 'Cán bộ trường',
  club: 'CLB / Đoàn thể',
  student_union: 'Hội Sinh viên',
};

const ROLE_LABELS: Record<string, string> = {
  member: 'Thành viên',
  super_admin: 'Quản trị hệ thống',
  activity_admin: 'Quản trị hoạt động',
};

const STATUS_BADGE: Record<string, { label: string; variant: string }> = {
  active: { label: 'Đang hoạt động', variant: 'success' },
  locked: { label: 'Đã khóa', variant: 'warning' },
  disabled: { label: 'Vô hiệu hóa', variant: 'error' },
};

function avatarInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((t) => t[0]?.toUpperCase() ?? '')
    .join('') || '?';
}

export default function ProfilePage() {
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  });

  const loadProfile = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const data = await mockApi.auth.getProfile();
      setProfile(data);
      reset({ fullName: data.fullName, phone: data.phone });
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể tải thông tin hồ sơ.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, [reset]);

  useEffect(() => {
    if (!isAuthorized) return;
    const timeout = window.setTimeout(() => { void loadProfile(); }, 120);
    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadProfile]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const updated = await mockApi.auth.updateProfile({
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
      });
      setProfile(updated);
      setEditing(false);
      show('Đã cập nhật hồ sơ.', 'success');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể cập nhật hồ sơ. Vui lòng thử lại.';
      show(message, 'error');
    }
  });

  const startEdit = () => {
    if (profile) {
      reset({ fullName: profile.fullName, phone: profile.phone });
    }
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    if (profile) {
      reset({ fullName: profile.fullName, phone: profile.phone });
    }
  };

  const initials = useMemo(() => avatarInitials(profile?.fullName ?? ''), [profile?.fullName]);
  const roleLabel = profile ? (ROLE_LABELS[profile.roleKey] ?? profile.role) : '';
  const statusInfo = profile ? (STATUS_BADGE[profile.status.toLowerCase()] ?? { label: profile.status, variant: '' }) : { label: '', variant: '' };

  if (guardLoading || !isAuthorized) return null;

  return (
    <>
      <Head>
        <title>Hồ sơ · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title="Hồ sơ cá nhân">
        <PageHead
          eyebrow="Bảng tin trường"
          title="Hồ sơ cá nhân"
          description="Xem và chỉnh sửa thông tin cá nhân của bạn."
        />

        {status === 'loading' && <LoadingState message="Đang tải hồ sơ..." />}
        {status === 'error' && (
          <ErrorState
            message={errorMessage || 'Không thể tải thông tin hồ sơ.'}
            onRetry={() => { void loadProfile(); }}
          />
        )}

        {status === 'ready' && profile && (
          <div className="profile-container">
            {/* ---- View mode ---- */}
            {!editing && (
              <div className="card">
                {/* Profile header */}
                <div className="profile-header">
                  <div className="profile-avatar">{initials}</div>
                  <div className="profile-header-info">
                    <h2 className="profile-header-name">{profile.fullName}</h2>
                    <p className="profile-header-email">{profile.email}</p>
                  </div>
                </div>

                {/* Field rows */}
                <div className="profile-field-list">
                  <div className="profile-field">
                    <span className="profile-field-label">Họ tên</span>
                    <span className="profile-field-value">{profile.fullName}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Email</span>
                    <span className="profile-field-value">{profile.email}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Số điện thoại</span>
                    <span className="profile-field-value">{profile.phone || '—'}</span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Vai trò</span>
                    <span className="profile-field-value">
                      <Badge status={profile.roleKey} label={roleLabel} />
                    </span>
                  </div>
                  {profile.ownerRole && (
                    <div className="profile-field">
                      <span className="profile-field-label">Loại tài khoản</span>
                      <span className="profile-field-value">
                        {USER_TYPE_LABELS[profile.ownerRole.toLowerCase()] ?? profile.ownerRole}
                      </span>
                    </div>
                  )}
                  <div className="profile-field">
                    <span className="profile-field-label">Trạng thái</span>
                    <span className="profile-field-value">
                      <Badge status={statusInfo.variant} label={statusInfo.label} />
                    </span>
                  </div>
                  <div className="profile-field">
                    <span className="profile-field-label">Ngày tham gia</span>
                    <span className="profile-field-value muted">
                      {profile.createdAt
                        ? new Date(profile.createdAt).toLocaleDateString('vi-VN')
                        : '—'}
                    </span>
                  </div>
                </div>

                {/* Edit button */}
                <div style={{ paddingTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="primary" onClick={startEdit}>
                    Chỉnh sửa
                  </Button>
                </div>
              </div>
            )}

            {/* ---- Edit mode ---- */}
            {editing && (
              <div className="card">
                {/* Profile header (read-only in edit mode) */}
                <div className="profile-header">
                  <div className="profile-avatar">{initials}</div>
                  <div className="profile-header-info">
                    <h2 className="profile-header-name">Chỉnh sửa hồ sơ</h2>
                    <p className="profile-header-email">{profile.email} (không thể thay đổi)</p>
                  </div>
                </div>

                <form className="stack" onSubmit={onSubmit} style={{ gap: 20 }}>
                  <Field label="Họ tên" htmlFor="fullName" error={errors.fullName?.message}>
                    <Input
                      id="fullName"
                      disabled={isSubmitting}
                      {...register('fullName')}
                    />
                  </Field>

                  <Field label="Số điện thoại" htmlFor="phone" error={errors.phone?.message}>
                    <Input
                      id="phone"
                      disabled={isSubmitting}
                      {...register('phone')}
                    />
                  </Field>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8 }}>
                    <Button type="button" variant="secondary" disabled={isSubmitting} onClick={cancelEdit}>
                      Hủy
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmitting}>
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </DashboardLayout>
    </>
  );
}
