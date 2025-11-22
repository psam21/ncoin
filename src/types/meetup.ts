import type { NostrEvent } from './nostr';

/**
 * Meetup form data interface
 * Maps to MeetupForm fields
 */
export interface MeetupData {
  // Basic Information
  name: string;
  description: string;
  
  // Date & Time
  startTime: number; // Unix timestamp (seconds)
  endTime?: number; // Unix timestamp (seconds, optional)
  timezone?: string; // IANA timezone (e.g., 'America/New_York')
  
  // Location
  location: string; // Physical address OR "Virtual"
  geohash?: string; // Geohash for map coordinates (optional)
  isVirtual: boolean;
  virtualLink?: string; // Video call link if virtual
  
  // Categorization
  meetupType: 'gathering' | 'workshop' | 'conference' | 'casual' | 'networking' | 'other';
  
  // Media
  imageUrl?: string; // Event image
  
  // Tags & Keywords
  tags: string[];
  
  // Host Information
  hostPubkey: string;
  coHosts?: string[]; // Array of pubkeys
}

/**
 * Meetup Nostr event (Kind 31923)
 */
export interface MeetupNostrEvent extends NostrEvent {
  kind: 31923;
  content: string; // Description (markdown)
}

/**
 * Meetup event from relay (parsed)
 */
export interface MeetupEvent {
  id: string;
  dTag: string;
  pubkey: string;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  timezone?: string;
  location: string;
  geohash?: string;
  isVirtual: boolean;
  virtualLink?: string;
  imageUrl?: string;
  meetupType: string;
  tags: string[];
  hostPubkey: string;
  coHosts?: string[];
  createdAt: number;
  publishedAt: number;
  rsvpCount?: {
    accepted: number;
    declined: number;
    tentative: number;
  };
}

/**
 * Meetup card data for display
 */
export interface MeetupCardData {
  id: string;
  dTag: string;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  location: string;
  isVirtual: boolean;
  imageUrl?: string;
  meetupType: string;
  tags: string[];
  pubkey: string; // Host for ownership check
  createdAt: number;
  rsvpCount?: {
    accepted: number;
    declined: number;
    tentative: number;
  };
}

/**
 * RSVP data
 */
export interface RSVPData {
  eventDTag: string; // Reference to meetup dTag
  eventPubkey: string; // Meetup creator pubkey
  status: 'accepted' | 'declined' | 'tentative';
  comment?: string; // Optional RSVP message
}

/**
 * RSVP Nostr event (Kind 31925)
 * NIP-33 parameterized replaceable event
 */
export interface RSVPNostrEvent extends NostrEvent {
  kind: 31925;
  content: string; // Optional comment
}

/**
 * Meetup publishing result
 */
export interface MeetupPublishingResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  error?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  [key: string]: unknown;
}

/**
 * Meetup publishing state
 */
export interface MeetupPublishingState {
  isPublishing: boolean;
  uploadProgress: number | MeetupPublishingProgress;
  currentStep: 'idle' | 'validating' | 'uploading' | 'creating' | 'publishing' | 'complete' | 'error';
  error: string | null;
  result: MeetupPublishingResult | null;
}

/**
 * Meetup publishing progress
 */
export interface MeetupPublishingProgress {
  step: 'validating' | 'uploading' | 'publishing' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: string;
}

/**
 * Meetup validation result
 */
export interface MeetupValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    virtualLink?: string;
    meetupType?: string;
    tags?: string;
    coHosts?: string;
  };
}

/**
 * Parsed RSVP with user info
 */
export interface ParsedRSVP {
  pubkey: string;
  eventDTag: string; // Reference to meetup dTag
  eventPubkey: string; // Meetup creator pubkey
  status: 'accepted' | 'declined' | 'tentative';
  comment?: string;
  timestamp: number;
  displayName?: string;
  npub?: string;
}
