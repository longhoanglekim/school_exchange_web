import { z } from 'zod';

/**
 * Zod schemas cho các form thuần frontend (React Hook Form + Zod).
 * Dùng cú pháp tương thích zod v4 (z.email(), z.enum(), z.superRefine, z.transform).
 * Mọi schema khớp quy tắc validation mô tả trong design.md / js/app.js.
 */

// ---- Login form (pages/login.tsx) ----
export const loginSchema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email hoặc username.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

// ---- Create Post (PostComposer) ----
// content/contact bắt buộc; items array 1-3 phần tử; title & campaignId tùy chọn.
// Quy tắc giá: Sale => price >= 0; Exchange/Donation => price = 0.
const postItemSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên sản phẩm.'),
  category: z.string().trim().min(1, 'Vui lòng chọn danh mục.'),
  price: z.number(),
  condition: z.enum(['new', 'used_good', 'used_normal', 'old']),
  imageName: z.string().trim().default(''),
});

export const createPostSchema = z
  .object({
    title: z.string().trim().optional(),
    content: z.string().trim().min(1, 'Vui lòng nhập nội dung bài đăng.'),
    type: z.enum(['Sale', 'Exchange', 'Donation']),
    contact: z.string().trim().min(1, 'Vui lòng nhập thông tin liên hệ.'),
    campaignId: z.string().optional(),
    items: z.array(postItemSchema).min(1, 'Cần ít nhất 1 sản phẩm.').max(3, 'Tối đa 3 sản phẩm.'),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'Sale') {
      data.items.forEach((item, i) => {
        if (item.price < 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['items', i, 'price'],
            message: 'Giá phải lớn hơn hoặc bằng 0.',
          });
        }
      });
    }
  })
  // Exchange/Donation luôn có price = 0 (UI ép giá trước khi submit).
  .transform((data) => ({
    ...data,
    items: data.items.map((item) => ({
      ...item,
      price: data.type === 'Sale' ? item.price : 0,
    })),
  }));

// ---- Create Campaign (pages/activity-admin/create-campaign.tsx) ----
// name bắt buộc; organizer/description tùy chọn; end > start.
export const createCampaignSchema = z
  .object({
    name: z.string().trim().min(1, 'Vui lòng nhập tên chiến dịch.'),
    organizer: z.string().trim().min(1).optional(),
    description: z.string().optional(),
    type: z.enum(['Fundraising', 'Donation', 'Mixed']),
    is_free: z.boolean(),
    commission_rate: z.number().min(0).max(100, 'Phí tham gia không được vượt quá 100%').optional(),
    start: z.string().min(1, 'Vui lòng chọn ngày bắt đầu.'),
    end: z.string().min(1, 'Vui lòng chọn ngày kết thúc.'),
  })
  .superRefine((data, ctx) => {
    // Date validation: end must be after start
    if (new Date(data.end).getTime() <= new Date(data.start).getTime()) {
      ctx.addIssue({
        code: 'custom',
        path: ['end'],
        message: 'Ngày kết thúc phải sau ngày bắt đầu',
      });
    }
    // Phí tham gia: required when campaign is NOT free
    if (!data.is_free && (data.commission_rate === undefined || data.commission_rate < 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['commission_rate'],
        message: 'Vui lòng nhập phí tham gia (0-100%).',
      });
    }
  });

// ---- Reject / Hide-Remove reason (ApprovalActions, HideRemoveModal) ----
export const rejectReasonSchema = z.object({
  reason: z.string().trim().min(1, 'Cần nhập lý do.'),
});

// ---- Request modal (RequestModal) ----
export const requestSchema = z.object({
  message: z.string().trim().min(1, 'Vui lòng nhập lời nhắn.'),
  contact: z.string().trim().min(1, 'Vui lòng nhập thông tin liên hệ.'),
});

// ---- Profile form (pages/member/profile.tsx) ----
export const profileSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên.'),
  phone: z.string().trim().min(1, 'Vui lòng nhập số điện thoại.'),
});

// ---- Submit Campaign Post (SubmitCampaignPost) ----
// Phải chọn một bài đã duyệt HOẶC nhập nội dung mới (ít nhất một trong hai).
export const submitCampaignPostSchema = z
  .object({
    fromApprovedPostId: z.string().optional(),
    content: z.string().optional(),
    imageName: z.string().optional(),
    note: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasApproved = (data.fromApprovedPostId ?? '').trim().length > 0;
    const hasContent = (data.content ?? '').trim().length > 0;
    if (!hasApproved && !hasContent) {
      ctx.addIssue({
        code: 'custom',
        path: ['content'],
        message: 'Chọn một bài đã duyệt hoặc nhập nội dung mới.',
      });
    }
  });

// ---- Inferred input types ----
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type RejectReasonInput = z.infer<typeof rejectReasonSchema>;
export type RequestInput = z.infer<typeof requestSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type SubmitCampaignPostInput = z.infer<typeof submitCampaignPostSchema>;
