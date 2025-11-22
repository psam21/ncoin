/**
 * Meetup Configuration
 * Centralized configuration for meetup feature
 */

export const MEETUP_CONFIG = {
  /**
   * Nostr Event Kinds
   */
  kinds: {
    MEETUP: 31923, // NIP-52 calendar event
    RSVP: 31925, // NIP-52 calendar event RSVP
  },

  /**
   * System tag for filtering meetups
   */
  systemTag: 'nostr-for-nomads-meetup',

  /**
   * Meetup types
   */
  meetupTypes: [
    { value: 'gathering', label: 'Social Gathering' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'conference', label: 'Conference' },
    { value: 'casual', label: 'Casual Meetup' },
    { value: 'networking', label: 'Networking Event' },
    { value: 'other', label: 'Other' },
  ] as const,

  /**
   * RSVP status options
   */
  rsvpStatuses: [
    { value: 'accepted', label: 'Going', color: 'green' },
    { value: 'tentative', label: 'Maybe', color: 'yellow' },
    { value: 'declined', label: 'Not Going', color: 'red' },
  ] as const,

  /**
   * Validation rules
   */
  validation: {
    name: {
      minLength: 3,
      maxLength: 100,
    },
    description: {
      minLength: 10,
      maxLength: 5000,
    },
    location: {
      minLength: 3,
      maxLength: 200,
    },
    virtualLink: {
      pattern: /^https?:\/\/.+/,
    },
    tags: {
      maxCount: 10,
      maxLength: 30,
    },
    coHosts: {
      maxCount: 10,
    },
  },

  /**
   * Time constraints
   */
  time: {
    minAdvanceNotice: 60 * 60, // 1 hour in seconds
    maxFutureTime: 365 * 24 * 60 * 60, // 1 year in seconds
    defaultDuration: 2 * 60 * 60, // 2 hours in seconds
  },

  /**
   * UI Configuration
   */
  ui: {
    cardsPerPage: 12,
    maxDescriptionPreview: 200,
    dateFormat: 'MMM dd, yyyy',
    timeFormat: 'h:mm a',
    dateTimeFormat: 'MMM dd, yyyy h:mm a',
  },

  /**
   * Filter options for explore page
   */
  filters: {
    timeframes: [
      { value: 'upcoming', label: 'Upcoming' },
      { value: 'thisWeek', label: 'This Week' },
      { value: 'thisMonth', label: 'This Month' },
      { value: 'past', label: 'Past Events' },
      { value: 'all', label: 'All Events' },
    ] as const,
    
    locations: [
      { value: 'all', label: 'All Locations' },
      { value: 'virtual', label: 'Virtual Only' },
      { value: 'physical', label: 'In-Person Only' },
    ] as const,
  },

  /**
   * Image upload configuration
   */
  image: {
    maxSize: 5 * 1024 * 1024, // 5MB
    acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    defaultAspectRatio: 16 / 9,
  },

  /**
   * RSVP Configuration
   */
  rsvp: {
    // Deterministic dTag format for replaceability
    dTagFormat: (eventDTag: string) => `rsvp:${eventDTag}`,
    
    // Canonical 'a' tag format
    aTagFormat: (eventPubkey: string, eventDTag: string) => 
      `31923:${eventPubkey}:${eventDTag}`,
    
    // Default RSVP status
    defaultStatus: 'accepted' as const,
    
    // Max comment length
    maxCommentLength: 500,
  },

  /**
   * Error messages
   */
  errors: {
    NAME_REQUIRED: 'Meetup name is required',
    NAME_TOO_SHORT: 'Meetup name must be at least 3 characters',
    NAME_TOO_LONG: 'Meetup name must be less than 100 characters',
    DESCRIPTION_REQUIRED: 'Description is required',
    DESCRIPTION_TOO_SHORT: 'Description must be at least 10 characters',
    DESCRIPTION_TOO_LONG: 'Description must be less than 5000 characters',
    START_TIME_REQUIRED: 'Start time is required',
    START_TIME_PAST: 'Start time must be in the future',
    START_TIME_TOO_FAR: 'Start time cannot be more than 1 year in the future',
    END_TIME_BEFORE_START: 'End time must be after start time',
    LOCATION_REQUIRED: 'Location is required',
    VIRTUAL_LINK_REQUIRED: 'Virtual link is required for virtual events',
    VIRTUAL_LINK_INVALID: 'Virtual link must be a valid URL',
    MEETUP_TYPE_REQUIRED: 'Meetup type is required',
    TOO_MANY_TAGS: 'Maximum 10 tags allowed',
    TAG_TOO_LONG: 'Tag must be less than 30 characters',
    TOO_MANY_COHOSTS: 'Maximum 10 co-hosts allowed',
    IMAGE_TOO_LARGE: 'Image must be less than 5MB',
    IMAGE_INVALID_TYPE: 'Image must be JPEG, PNG, or WebP',
    PUBLISH_FAILED: 'Failed to publish meetup',
    RSVP_FAILED: 'Failed to RSVP to meetup',
    DELETE_FAILED: 'Failed to delete meetup',
    NOT_AUTHORIZED: 'You are not authorized to perform this action',
    MEETUP_NOT_FOUND: 'Meetup not found',
  },
} as const;

/**
 * Type exports for config values
 */
export type MeetupType = typeof MEETUP_CONFIG.meetupTypes[number]['value'];
export type RSVPStatus = typeof MEETUP_CONFIG.rsvpStatuses[number]['value'];
export type TimeframeFilter = typeof MEETUP_CONFIG.filters.timeframes[number]['value'];
export type LocationFilter = typeof MEETUP_CONFIG.filters.locations[number]['value'];
