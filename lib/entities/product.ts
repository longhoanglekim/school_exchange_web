import type { TransactionType, PostStatus } from '@/lib/types/post';

export interface ProductItemEntity {
  name: string;
  categoryId: number;
  price: number;
  condition: 'new' | 'used_good' | 'used_normal' | 'old';
  image: string;
}

/**
 * ProductEntity — mirrors the Products table from DOCX schema.
 *
 * In the UI layer this is exposed as `Post` (via mappers).
 * The `image` field stores icon placeholder text (∑, BOOK, etc.) in mock
 * mode; it will carry real image URLs when swapped to a Java REST backend.
 * `items` array holds individual products within this post (1-3 items).
 */
export interface ProductEntity {
  productId: number;
  userId: number; // FK -> UserEntity.userId
  categoryId: number; // FK -> CategoryEntity.categoryId (derived from first item)
  title: string;
  description: string;
  image: string; // icon placeholder in mock; image URL in production
  price: number; // derived from first item
  type: TransactionType;
  status: PostStatus;
  reason?: string; // rejection / removal reason
  /** FK -> CampaignEntity.campaignId. undefined => Normal Post. */
  campaignId?: number;
  contact: string;
  createdAt: string; // ISO date (YYYY-MM-DD)
  items: ProductItemEntity[]; // individual products (1-3)
}
