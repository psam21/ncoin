import type { ProductAttachment } from './attachments';
import type { NostrEvent } from './nostr';

/**
 * Product form data interface
 * Maps to ProductForm fields
 */
export interface ProductData {
  // Basic Information
  title: string;
  description: string;
  price: number;
  currency: 'BTC' | 'sats' | 'USD';
  
  // Product Details
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location: string;
  contact: string; // Nostr npub or contact method
  
  // Media & Attachments
  attachments: ProductAttachment[];
  
  // Tags & Keywords
  tags: string[];
}

/**
 * Product Nostr event (Kind 30023)
 */
export interface ProductNostrEvent extends NostrEvent {
  kind: 30023;
  tags: [
    ['d', string], // Unique identifier (dTag)
    ['t', 'nostr-for-nomads-shop'], // System tag (hidden)
    ['title', string],
    ['price', string],
    ['currency', string],
    ['category', string],
    ['condition', string],
    ['location', string],
    ['contact', string],
    ...Array<
      | ['t', string] // User tags
      | ['image', string] // Media URLs
      | ['video', string]
      | ['audio', string]
      | ['imeta', ...string[]] // NIP-94 metadata
    >
  ];
  content: string; // JSON stringified description
}

/**
 * Product event from relay (parsed)
 */
export interface ProductEvent {
  id: string;
  dTag: string;
  pubkey: string;
  title: string;
  summary: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: string;
  contact: string;
  tags: string[];
  media: {
    images: MediaAttachment[];
    audio: MediaAttachment[];
    videos: MediaAttachment[];
  };
  createdAt: number;
  publishedAt: number;
}

/**
 * Product card data for display
 */
export interface ProductCardData {
  id: string;
  dTag: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: string;
  imageUrl?: string; // First media URL
  tags: string[];
  pubkey: string; // Author for ownership check
  createdAt: number;
}

/**
 * Type alias: ShopProduct is same as ProductCardData
 * Used in stores for consistency with temp-cb-reference pattern
 */
export type ShopProduct = ProductCardData;

/**
 * Type alias: ProductExploreItem is same as ProductCardData
 * Used in public browse/explore views
 */
export type ProductExploreItem = ProductCardData;

/**
 * Product publishing result
 */
export interface ProductPublishingResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  error?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  [key: string]: unknown;
}

/**
 * Product update result
 */
export interface UpdateProductResult {
  success: boolean;
  eventId?: string;
  product?: ProductEvent;
  publishedRelays?: string[];
  failedRelays?: string[];
  error?: string;
  [key: string]: unknown;
}

/**
 * Product publishing state
 */
export interface ProductPublishingState {
  isPublishing: boolean;
  uploadProgress: number | ProductPublishingProgress;
  currentStep: 'idle' | 'validating' | 'uploading' | 'creating' | 'publishing' | 'complete' | 'error';
  error: string | null;
  result: ProductPublishingResult | null;
}

/**
 * Product publishing progress
 */
export interface ProductPublishingProgress {
  step: 'validating' | 'uploading' | 'publishing' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: string;
  attachmentProgress?: {
    current: number;
    total: number;
    currentFile: string;
  };
  [key: string]: unknown;
}

/**
 * Product validation result
 */
export interface ProductValidationResult {
  valid: boolean;
  errors: {
    title?: string;
    description?: string;
    price?: string;
    currency?: string;
    category?: string;
    condition?: string;
    location?: string;
    contact?: string;
    attachments?: string;
    tags?: string;
  };
}

interface MediaAttachment {
  url: string;
  mimeType?: string;
  hash?: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}
