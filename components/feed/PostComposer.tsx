import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/common/Button';
import { Field } from '@/components/common/Field';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { UploadField } from '@/components/common/UploadField';
import { useToast } from '@/components/common/Toast';
import { PostPreview } from '@/components/feed/PostPreview';
import { createPostSchema } from '@/lib/types/schemas';
import type { Campaign } from '@/lib/types/campaign';
import type { Category } from '@/lib/types/category';
import type { CreatePostInput } from '@/lib/services/mockApi';

const CONDITION_LABELS: Record<string, string> = {
  new: 'Mới',
  used_good: 'Đã qua sử dụng - Tốt',
  used_normal: 'Đã qua sử dụng - Bình thường',
  old: 'Cũ',
};

const DEFAULT_ITEM = {
  name: '',
  category: '',
  price: 0,
  condition: 'used_good' as const,
  imageName: '',
};

interface PostComposerProps {
  categories: Category[];
  campaigns: Campaign[];
  defaultCampaignId?: string;
  initial?: Partial<CreatePostInput>;
  onSubmit: (input: CreatePostInput) => Promise<void>;
}

export function PostComposer({
  categories,
  campaigns,
  defaultCampaignId,
  initial,
  onSubmit,
}: PostComposerProps) {
  const { show } = useToast();

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      title: initial?.title ?? '',
      content: initial?.content ?? '',
      type: initial?.type ?? 'Sale',
      contact: initial?.contact ?? '',
      campaignId: defaultCampaignId ?? initial?.campaignId ?? '',
      items: initial?.items?.length
        ? initial.items.map((item) => ({ ...DEFAULT_ITEM, ...item }))
        : [{ ...DEFAULT_ITEM }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const transactionType = useWatch({ control, name: 'type' });

  // Reset all item prices to 0 when type is not Sale
  useEffect(() => {
    if (transactionType !== 'Sale') {
      fields.forEach((_, i) => {
        setValue(`items.${i}.price`, 0);
      });
    }
  }, [transactionType, fields, setValue]);

  // Callback per item: when UploadField emits preview, set the fake image path
  const makePreviewsHandler = useCallback(
    (itemIndex: number) => (urls: string[]) => {
      const sampleIndex = Math.floor(Math.random() * 5) + 1;
      const fakePath = `/images/samples/sample-${sampleIndex}.svg`;
      setValue(`items.${itemIndex}.imageName`, fakePath, { shouldValidate: true });
      // Also update a local preview state if needed — for now PostPreview reads form state
    },
    [setValue],
  );

  // Preview needs per-item image previews. We store them keyed by index.
  // For simplicity, PostPreview will read imageName from form state directly.

  const submit = handleSubmit(
    async (values) => {
      await onSubmit({
        title: values.title,
        content: values.content,
        type: values.type,
        contact: values.contact,
        campaignId: values.campaignId || undefined,
        items: values.items.map((item) => ({
          name: item.name,
          category: item.category,
          price: transactionType === 'Sale' ? item.price : 0,
          condition: item.condition,
          imageName: item.imageName || '',
        })),
      });
    },
    () => {
      show('Vui lòng kiểm tra lại các trường được đánh dấu.', 'error');
    },
  );

  const maxItems = 3;

  // Read all items for preview
  const watchedItems = useWatch({ control, name: 'items' });

  return (
    <section className="grid cols-2" style={{ alignItems: 'start' }}>
      {/* ---- left: form ---- */}
      <form className="card stack" onSubmit={submit}>
        {/* ---- Post-level fields ---- */}
        <Field
          label="Bạn muốn chia sẻ gì?"
          htmlFor="content"
          error={errors.content?.message}
        >
          <Textarea
            id="content"
            placeholder="Mô tả chung về các sản phẩm bạn muốn đăng..."
            {...register('content')}
          />
        </Field>

        <Field label="Hình thức giao dịch" htmlFor="type">
          <Select id="type" {...register('type')}>
            <option value="Sale">Bán lại</option>
            <option value="Exchange">Trao đổi</option>
            <option value="Donation">Quyên góp</option>
          </Select>
        </Field>

        {/* ---- Items ---- */}
        <div className="stack" style={{ gap: 16 }}>
          <h3 style={{ margin: 0 }}>Sản phẩm ({fields.length}/{maxItems})</h3>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="card stack"
              style={{ border: '1px solid var(--border)', padding: 12, gap: 8 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Sản phẩm {index + 1}</strong>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => remove(index)}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    Xóa
                  </Button>
                )}
              </div>

              <Field label="Tên sản phẩm" error={errors.items?.[index]?.name?.message}>
                <Input
                  placeholder="VD: Máy tính Casio fx-580VN X"
                  {...register(`items.${index}.name`)}
                />
              </Field>

              <div className="grid cols-2">
                <Field label="Danh mục" error={errors.items?.[index]?.category?.message}>
                  <Select {...register(`items.${index}.category`)}>
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Tình trạng">
                  <Select {...register(`items.${index}.condition`)}>
                    {Object.entries(CONDITION_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {transactionType === 'Sale' ? (
                <Field label="Giá bán (VNĐ)" error={errors.items?.[index]?.price?.message}>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Nhập giá bán"
                    {...register(`items.${index}.price`, { valueAsNumber: true })}
                  />
                </Field>
              ) : (
                <Field label="Giá">
                  <Input value="Miễn phí" disabled />
                </Field>
              )}

              <Field label="Ảnh sản phẩm">
                <UploadField
                  id={`item-image-${index}`}
                  hint="Chọn ảnh cho sản phẩm này"
                  onPreviewsChange={makePreviewsHandler(index)}
                  {...register(`items.${index}.imageName`)}
                />
              </Field>
            </div>
          ))}

          {fields.length < maxItems && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => append({ ...DEFAULT_ITEM })}
            >
              + Thêm sản phẩm
            </Button>
          )}
        </div>

        <Field label="Tiêu đề bài đăng (tùy chọn)" htmlFor="title">
          <Input id="title" placeholder="Tiêu đề tổng hợp cho bài đăng" {...register('title')} />
        </Field>

        <Field
          label="Thông tin liên hệ"
          htmlFor="contact"
          error={errors.contact?.message}
        >
          <Input id="contact" placeholder="Email hoặc số điện thoại" {...register('contact')} />
        </Field>

        <Field
          label="Chiến dịch"
          htmlFor="campaignId"
          helperText="Nếu chọn chiến dịch, bài đăng sẽ xuất hiện trong feed của chiến dịch sau khi được duyệt."
        >
          <Select id="campaignId" {...register('campaignId')}>
            <option value="">Không tham gia chiến dịch</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" variant="primary" loading={isSubmitting}>
          Gửi duyệt bài
        </Button>

        <p className="small muted">
          Trước khi gửi, hãy đảm bảo bài đăng có nội dung, ít nhất 1 sản phẩm với đầy đủ thông tin.
        </p>
      </form>

      {/* ---- right: preview ---- */}
      <aside
        className="card stack"
        style={{ position: 'sticky', top: '92px' }}
      >
        <h2>Xem trước bài đăng</h2>
        <PostPreview
          control={control as any}
          campaigns={campaigns}
          items={watchedItems || []}
        />
      </aside>
    </section>
  );
}
