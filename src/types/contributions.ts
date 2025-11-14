import type { GenericAttachment } from './attachments';
import type { NostrEvent } from './nostr';

/**
 * Nomad Contribution Types
 * Simplified from heritage types for nomad-focused contributions
 */

/**
 * Contribution form data interface
 * Maps to the ContributionForm fields
 */
export interface ContributionData {
  // Section 1: Basic Information
  title: string;
  category: string;
  contributionType: string;

  // Section 2: Details & Media
  description: string;
  language?: string;
  location?: string; // City/place where this happened/applies
  region: string;
  country: string;

  // Section 3: Media & Attachments
  attachments: GenericAttachment[];

  // Section 4: Tags & Keywords
  tags: string[];
}

/**
 * Contribution Nostr event (Kind 30023)
 * Extended from base NostrEvent with contribution-specific tags
 */
export interface ContributionNostrEvent extends NostrEvent {
  kind: 30023;
  tags: [
    ['d', string], // Unique identifier
    ['t', 'nostr-for-nomads-contribution'], // System tag (hidden)
    ['title', string],
    ['category', string],
    ['contribution-type', string], // Maps to contributionType
    ['region', string],
    ['country', string],
    ...Array<
      | ['language', string]
      | ['community', string] // Maps to location
      | ['t', string] // User tags
      | ['image', string] // Media URLs
      | ['video', string]
      | ['audio', string]
    >
  ];
  content: string; // JSON stringified description
}

/**
 * Contribution data for Nostr event creation
 * Simplified interface for the publishing hook
 */
export interface ContributionEventData {
  title: string;
  category: string;
  contributionType: string;
  region: string;
  country: string;
  description: string;
  language?: string;
  location?: string;
  tags: string[];
  attachments: GenericAttachment[];
}

/**
 * Contribution publishing result
 */
export interface ContributionPublishingResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  error?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  [key: string]: unknown; // For generic wrapper compatibility
}

/**
 * Contribution publishing state
 */
export interface ContributionPublishingState {
  isPublishing: boolean;
  uploadProgress: number | ContributionPublishingProgress;
  currentStep: 'idle' | 'validating' | 'uploading' | 'creating' | 'publishing' | 'complete' | 'error';
  error: string | null;
  result: ContributionPublishingResult | null;
}

/**
 * Contribution publishing progress
 */
export interface ContributionPublishingProgress {
  step: 'idle' | 'validating' | 'uploading' | 'publishing' | 'complete' | 'error';
  progress: number;
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
 * Contribution attachment (extends GenericAttachment)
 */
export interface ContributionAttachment extends GenericAttachment {
  type: 'image' | 'video' | 'audio';
  contributionId?: string;
  displayOrder: number;
  category?: 'image' | 'video' | 'audio';
}

/**
 * Contribution validation result
 */
export interface ContributionValidationResult {
  valid: boolean;
  errors: {
    title?: string;
    category?: string;
    contributionType?: string;
    description?: string;
    region?: string;
    country?: string;
    attachments?: string;
    tags?: string;
  };
}

/**
 * Contribution for display (from Nostr event)
 */
export interface Contribution {
  id: string;
  dTag: string;
  title: string;
  category: string;
  contributionType: string;
  region: string;
  country: string;
  description: string;
  language?: string;
  location?: string;
  tags: string[];
  media: Array<{ type: 'image' | 'video' | 'audio'; url: string }>;
  author: {
    pubkey: string;
    npub?: string;
    displayName?: string;
  };
  createdAt: number;
  updatedAt?: number;
  relays?: string[];
}

/**
 * Contribution card data for my-contributions dashboard display
 * Lightweight interface for grid/list view
 */
export interface ContributionCardData {
  id: string;
  dTag: string;
  title: string;
  description: string;
  contributionType: string;
  category: string;
  location: string;
  region: string;
  country?: string;
  imageUrl?: string;
  tags: string[];
  pubkey: string;
  createdAt: number;
}

/**
 * Tag mapping helpers
 */
export const CONTRIBUTION_TAG_KEYS = {
  D_TAG: 'd',
  SYSTEM_TAG: 't', // For 'nostr-for-nomads-contribution'
  TITLE: 'title',
  CATEGORY: 'category',
  CONTRIBUTION_TYPE: 'contribution-type',
  REGION: 'region',
  COUNTRY: 'country',
  LANGUAGE: 'language',
  LOCATION: 'community', // Reuses community tag for location
  USER_TAG: 't',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
} as const;

/**
 * System tag constant
 */
export const CONTRIBUTION_SYSTEM_TAG = 'nostr-for-nomads-contribution';

/**
 * Helper to extract contribution data from Nostr event
 */
export const parseContributionEvent = (event: NostrEvent): Contribution | null => {
  try {
    const tags = event.tags;
    const getTag = (key: string): string | undefined => {
      const tag = tags.find(t => t[0] === key);
      return tag ? tag[1] : undefined;
    };

    const getAllTags = (key: string): string[] => {
      return tags.filter(t => t[0] === key).map(t => t[1]);
    };

    const dTag = getTag('d');
    const title = getTag('title');
    const category = getTag('category');
    const contributionType = getTag('contribution-type');
    const region = getTag('region');
    const country = getTag('country');

    if (!dTag || !title || !category || !contributionType || !region || !country) {
      return null;
    }

    // Parse user tags (exclude system tag)
    const userTags = getAllTags('t').filter(tag => tag !== CONTRIBUTION_SYSTEM_TAG);

    // Parse media
    const images = getAllTags('image').map(url => ({ type: 'image' as const, url }));
    const videos = getAllTags('video').map(url => ({ type: 'video' as const, url }));
    const audios = getAllTags('audio').map(url => ({ type: 'audio' as const, url }));
    const media = [...images, ...videos, ...audios];

    // Parse description from content
    let description = '';
    try {
      const content = JSON.parse(event.content);
      description = content.description || '';
    } catch {
      description = event.content;
    }

    return {
      id: event.id || dTag,
      dTag,
      title,
      category,
      contributionType,
      region,
      country,
      description,
      language: getTag('language'),
      location: getTag('community'), // Maps from community tag
      tags: userTags,
      media,
      author: {
        pubkey: event.pubkey,
      },
      createdAt: event.created_at,
      relays: [], // Will be populated by business service
    };
  } catch (error) {
    console.error('Failed to parse contribution event:', error);
    return null;
  }
};

/**
 * Type guard for contribution event
 */
export const isContributionEvent = (event: NostrEvent): event is ContributionNostrEvent => {
  return (
    event.kind === 30023 &&
    event.tags.some(t => t[0] === 't' && t[1] === CONTRIBUTION_SYSTEM_TAG)
  );
};

/**
 * Validation moved to ContributionValidationService
 * Re-export here for backward compatibility
 * @deprecated Import from ContributionValidationService instead
 */
export { validateContributionData } from '@/services/business/ContributionValidationService';

/**
 * Custom fields for content detail display
 */
export interface ContributionCustomFields extends Record<string, unknown> {
  contributionType?: string;
  category?: string;
  region?: string;
  country?: string;
  language?: string;
  location?: string;
}

