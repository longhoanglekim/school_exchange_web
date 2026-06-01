import Head from 'next/head';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PostComposer } from '@/components/feed/PostComposer';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHead } from '@/components/layout/PageHead';
import { useToast } from '@/components/common/Toast';
import { ApiError, mockApi, type CreatePostInput } from '@/lib/services/mockApi';
import { useRequireRole } from '@/lib/withRoleGuard';
import type { Campaign } from '@/lib/types/campaign';
import type { Category } from '@/lib/types/category';
import type { Post } from '@/lib/types/post';

type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Map Post entity to CreatePostInput for pre-filling the edit form.
 * Only includes fields the PostComposer form uses as initial values.
 */
function postToFormInput(post: Post): Partial<CreatePostInput> {
  return {
    title: post.title ?? '',
    content: post.content ?? post.description ?? '',
    category: post.category ?? '',
    type: post.type,
    price: post.price ?? 0,
    imageName: '', // Do not pre-fill image — user must re-upload or leave as-is
    contact: post.contact ?? '',
    campaignId: post.campaignId ?? '',
  };
}

export default function CreatePostPage() {
  const router = useRouter();
  const { show } = useToast();
  const { isLoading: guardLoading, isAuthorized } = useRequireRole(['member']);

  const [status, setStatus] = useState<LoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [editingPost, setEditingPost] = useState<Partial<CreatePostInput> | undefined>(undefined);

  const editId = useMemo(() => {
    const edit = router.query.edit;
    return typeof edit === 'string' ? edit : undefined;
  }, [router.query.edit]);

  const isEditing = Boolean(editId);

  const defaultCampaignId = useMemo(() => {
    const campaign = router.query.campaign;
    if (typeof campaign === 'string') {
      return campaign;
    }
    return undefined;
  }, [router.query.campaign]);

  const loadData = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const promises: Promise<unknown>[] = [
        mockApi.categories.listActive(),
        mockApi.campaigns.listCampaigns(),
      ];

      if (editId) {
        promises.push(
          mockApi.posts.getPost(editId).then((post) => {
            setEditingPost(postToFormInput(post));
          }),
        );
      }

      const [activeCategories, availableCampaigns] = await Promise.all(promises) as [Category[], Campaign[]];

      setCategories(activeCategories);
      setCampaigns(availableCampaigns);
      setStatus('ready');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể tải dữ liệu tạo bài đăng.';
      setErrorMessage(message);
      setStatus('error');
    }
  }, [editId]);

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadData();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [isAuthorized, loadData]);

  const handleSubmit = async (input: CreatePostInput) => {
    try {
      if (isEditing && editId) {
        await mockApi.posts.updatePost(editId, input);
        show('Đã cập nhật bài đăng. Bài sẽ được duyệt lại.', 'success');
      } else {
        await mockApi.posts.createPost(input);
        show(
          input.campaignId
            ? 'Đã gửi campaign post. Trạng thái: Chờ duyệt.'
            : 'Đã gửi bài đăng. Trạng thái: Chờ duyệt.',
          'success',
        );
      }
      await router.push('/member/my-posts');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Không thể lưu bài đăng. Vui lòng thử lại.';
      show(message, 'error');
      throw error;
    }
  };

  if (guardLoading || !isAuthorized) {
    return null;
  }

  return (
    <>
      <Head>
        <title>{isEditing ? 'Sửa bài đăng' : 'Tạo bài đăng'} · School Item Exchange</title>
      </Head>

      <DashboardLayout eyebrow="Cổng trường học" title={isEditing ? 'Sửa bài đăng' : 'Tạo bài đăng'}>
        <PageHead
          title={isEditing ? 'Sửa bài đăng' : 'Tạo bài đăng'}
          description={
            isEditing
              ? 'Chỉnh sửa nội dung bài đăng. Bài sẽ được gửi duyệt lại sau khi sửa.'
              : 'Chia sẻ món đồ bạn muốn bán, trao đổi hoặc quyên góp. Bài đăng sẽ được admin duyệt trước khi hiển thị.'
          }
        />

        {status === 'loading' ? (
          <LoadingState message={isEditing ? 'Đang tải bài đăng...' : 'Đang tải dữ liệu form tạo bài đăng...'} />
        ) : null}

        {status === 'error' ? (
          <ErrorState
            message={errorMessage || 'Không thể tải dữ liệu tạo bài đăng.'}
            onRetry={() => {
              void loadData();
            }}
          />
        ) : null}

        {status === 'ready' ? (
          <PostComposer
            categories={categories}
            campaigns={campaigns}
            defaultCampaignId={defaultCampaignId}
            initial={editingPost}
            onSubmit={handleSubmit}
          />
        ) : null}
      </DashboardLayout>
    </>
  );
}
