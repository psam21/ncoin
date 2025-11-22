import type { NostrEvent } from '@/types/nostr';
import type {
  MeetupData,
  MeetupNostrEvent,
  RSVPData,
  RSVPNostrEvent,
} from '@/types/meetup';
import { MEETUP_CONFIG } from '@/config/meetup';

/**
 * MeetupEventService
 * Handles creation and parsing of Nostr events for meetups
 * Layer: Event Service (stateless, pure functions)
 */
export class MeetupEventService {
  /**
   * Create a meetup event (Kind 31923)
   */
  static createMeetupEvent(
    data: MeetupData,
    signer: { getPublicKey: () => Promise<string> }
  ): Promise<MeetupNostrEvent> {
    return this.createEvent(data, signer);
  }

  /**
   * Create meetup event implementation
   */
  private static async createEvent(
    data: MeetupData,
    signer: { getPublicKey: () => Promise<string> }
  ): Promise<MeetupNostrEvent> {
    const pubkey = await signer.getPublicKey();
    const now = Math.floor(Date.now() / 1000);

    // Generate deterministic dTag (use timestamp + pubkey for uniqueness)
    const dTag = `meetup-${now}-${pubkey.slice(0, 8)}`;

    // Build tags array
    const tags: string[][] = [
      ['d', dTag],
      ['t', MEETUP_CONFIG.systemTag],
      ['name', data.name],
      ['start', data.startTime.toString()],
      ['location', data.location],
      ['p', data.hostPubkey, '', 'host'],
    ];

    // Optional tags
    if (data.endTime) {
      tags.push(['end', data.endTime.toString()]);
    }

    if (data.timezone) {
      tags.push(['timezone', data.timezone]);
    }

    if (data.geohash) {
      tags.push(['g', data.geohash]);
    }

    if (data.imageUrl) {
      tags.push(['image', data.imageUrl]);
    }

    if (data.isVirtual && data.virtualLink) {
      tags.push(['virtual', data.virtualLink]);
    }

    // Add meetup type tag
    tags.push(['meetup-type', data.meetupType]);

    // Add co-hosts
    if (data.coHosts && data.coHosts.length > 0) {
      data.coHosts.forEach((coHost) => {
        tags.push(['p', coHost, '', 'co-host']);
      });
    }

    // Add user tags
    if (data.tags && data.tags.length > 0) {
      data.tags.forEach((tag) => {
        tags.push(['t', tag.toLowerCase()]);
      });
    }

    const event: MeetupNostrEvent = {
      kind: MEETUP_CONFIG.kinds.MEETUP,
      pubkey,
      created_at: now,
      tags,
      content: data.description,
    } as MeetupNostrEvent;

    return event;
  }

  /**
   * Create an RSVP event (Kind 31925)
   * Uses NIP-33 parameterized replaceable events
   */
  static async createRSVPEvent(
    data: RSVPData,
    signer: { getPublicKey: () => Promise<string> }
  ): Promise<RSVPNostrEvent> {
    const pubkey = await signer.getPublicKey();
    const now = Math.floor(Date.now() / 1000);

    // Deterministic dTag for replaceability (one RSVP per user per meetup)
    const dTag = MEETUP_CONFIG.rsvp.dTagFormat(data.eventDTag);

    // Canonical 'a' tag format
    const aTag = MEETUP_CONFIG.rsvp.aTagFormat(data.eventPubkey, data.eventDTag);

    const tags: string[][] = [
      ['d', dTag],
      ['a', aTag],
      ['status', data.status],
      ['p', data.eventPubkey], // Event creator
    ];

    const event: RSVPNostrEvent = {
      kind: MEETUP_CONFIG.kinds.RSVP,
      pubkey,
      created_at: now,
      tags,
      content: data.comment || '',
    } as RSVPNostrEvent;

    return event;
  }

  /**
   * Parse a meetup event from relay
   */
  static parseMeetupEvent(event: NostrEvent) {
    if (event.kind !== MEETUP_CONFIG.kinds.MEETUP) {
      throw new Error(`Invalid event kind: ${event.kind}`);
    }

    const tags = event.tags;
    const getTag = (name: string): string | undefined => {
      const tag = tags.find((t) => t[0] === name);
      return tag ? tag[1] : undefined;
    };

    const getAllTags = (name: string): string[] => {
      return tags.filter((t) => t[0] === name).map((t) => t[1]);
    };

    const dTag = getTag('d');
    if (!dTag) {
      throw new Error('Missing dTag in meetup event');
    }

    const name = getTag('name');
    if (!name) {
      throw new Error('Missing name in meetup event');
    }

    const startTimeStr = getTag('start');
    if (!startTimeStr) {
      throw new Error('Missing start time in meetup event');
    }

    const startTime = parseInt(startTimeStr, 10);
    if (isNaN(startTime)) {
      throw new Error('Invalid start time');
    }

    const location = getTag('location');
    if (!location) {
      throw new Error('Missing location in meetup event');
    }

    // Optional fields
    const endTimeStr = getTag('end');
    const endTime = endTimeStr ? parseInt(endTimeStr, 10) : undefined;

    const timezone = getTag('timezone');
    const geohash = getTag('g');
    const imageUrl = getTag('image');
    const virtualLink = getTag('virtual');
    const meetupType = getTag('meetup-type') || 'other';

    // Get host and co-hosts
    const pTags = tags.filter((t) => t[0] === 'p');
    const hostTag = pTags.find((t) => t[3] === 'host');
    const hostPubkey = hostTag ? hostTag[1] : event.pubkey;
    
    const coHostTags = pTags.filter((t) => t[3] === 'co-host');
    const coHosts = coHostTags.length > 0 ? coHostTags.map((t) => t[1]) : undefined;

    // Get user tags (exclude system tag)
    const userTags = getAllTags('t').filter(
      (t) => t !== MEETUP_CONFIG.systemTag
    );

    const isVirtual = location.toLowerCase() === 'virtual' || !!virtualLink;

    return {
      id: event.id || '',
      dTag,
      pubkey: event.pubkey,
      name,
      description: event.content,
      startTime,
      endTime,
      timezone,
      location,
      geohash,
      isVirtual,
      virtualLink,
      imageUrl,
      meetupType,
      tags: userTags,
      hostPubkey,
      coHosts,
      createdAt: event.created_at,
      publishedAt: event.created_at,
    };
  }

  /**
   * Parse an RSVP event from relay
   */
  static parseRSVPEvent(event: NostrEvent) {
    if (event.kind !== MEETUP_CONFIG.kinds.RSVP) {
      throw new Error(`Invalid event kind: ${event.kind}`);
    }

    const tags = event.tags;
    const getTag = (name: string): string | undefined => {
      const tag = tags.find((t) => t[0] === name);
      return tag ? tag[1] : undefined;
    };

    const dTag = getTag('d');
    if (!dTag) {
      throw new Error('Missing dTag in RSVP event');
    }

    const aTag = getTag('a');
    if (!aTag) {
      throw new Error('Missing aTag in RSVP event');
    }

    const status = getTag('status') as 'accepted' | 'declined' | 'tentative' | undefined;
    if (!status) {
      throw new Error('Missing status in RSVP event');
    }

    const eventPubkey = getTag('p');
    if (!eventPubkey) {
      throw new Error('Missing event creator pubkey in RSVP event');
    }

    // Extract eventDTag from aTag (format: 31923:pubkey:dTag)
    const aTagParts = aTag.split(':');
    if (aTagParts.length !== 3 || aTagParts[0] !== '31923') {
      throw new Error('Invalid aTag format');
    }
    const eventDTag = aTagParts[2];

    return {
      pubkey: event.pubkey,
      eventDTag,
      eventPubkey,
      status,
      comment: event.content || undefined,
      timestamp: event.created_at,
    };
  }

  /**
   * Create a deletion event for a meetup
   */
  static async createDeletionEvent(
    eventIds: string[],
    signer: { getPublicKey: () => Promise<string> },
    reason?: string
  ): Promise<NostrEvent> {
    const pubkey = await signer.getPublicKey();
    const now = Math.floor(Date.now() / 1000);

    const tags: string[][] = eventIds.map((id) => ['e', id]);

    return {
      kind: 5,
      pubkey,
      created_at: now,
      tags,
      content: reason || 'Deleted',
    } as NostrEvent;
  }

  /**
   * Validate meetup event structure
   */
  static validateMeetupEvent(event: NostrEvent): boolean {
    if (event.kind !== MEETUP_CONFIG.kinds.MEETUP) {
      return false;
    }

    const tags = event.tags;
    const hasTag = (name: string) => tags.some((t) => t[0] === name);

    // Required tags
    const requiredTags = ['d', 'name', 'start', 'location'];
    const hasAllRequired = requiredTags.every((tag) => hasTag(tag));

    if (!hasAllRequired) {
      return false;
    }

    // Must have system tag
    const hasSystemTag = tags.some(
      (t) => t[0] === 't' && t[1] === MEETUP_CONFIG.systemTag
    );

    return hasSystemTag;
  }

  /**
   * Validate RSVP event structure
   */
  static validateRSVPEvent(event: NostrEvent): boolean {
    if (event.kind !== MEETUP_CONFIG.kinds.RSVP) {
      return false;
    }

    const tags = event.tags;
    const hasTag = (name: string) => tags.some((t) => t[0] === name);

    // Required tags
    const requiredTags = ['d', 'a', 'status', 'p'];
    return requiredTags.every((tag) => hasTag(tag));
  }
}
