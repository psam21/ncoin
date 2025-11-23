import { logger } from '../core/LoggingService';
import type { NostrEvent } from '@/types/nostr';
import type { MeetupEvent, MeetupCardData, ParsedRSVP } from '@/types/meetup';
import { MEETUP_CONFIG } from '@/config/meetup';
import { queryEvents } from './GenericRelayService';
import type { Filter } from 'nostr-tools';

/**
 * GenericMeetService
 * Generic protocol layer for meetup operations
 * Handles parsing and querying meetup events from relays
 */

/**
 * Parse a meetup event from relay
 */
function parseMeetupEvent(event: NostrEvent): MeetupEvent | null {
  try {
    if (event.kind !== MEETUP_CONFIG.kinds.MEETUP) {
      logger.warn('Event is not a meetup kind', {
        service: 'GenericMeetService',
        method: 'parseMeetupEvent',
        eventId: event.id,
        kind: event.kind,
        expectedKind: MEETUP_CONFIG.kinds.MEETUP,
      });
      return null;
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
      logger.warn('Meetup event missing dTag', {
        service: 'GenericMeetService',
        method: 'parseMeetupEvent',
        eventId: event.id,
        availableTags: tags.map(t => t[0]).join(', '),
      });
      return null;
    }

    const name = getTag('name');
    if (!name) {
      logger.warn('Meetup event missing name', {
        service: 'GenericMeetService',
        method: 'parseMeetupEvent',
        eventId: event.id,
        dTag,
        availableTags: tags.map(t => t[0]).join(', '),
      });
      return null;
    }

    const startTimeStr = getTag('start');
    if (!startTimeStr) {
      logger.warn('Meetup event missing start time', {
        service: 'GenericMeetService',
        method: 'parseMeetupEvent',
        eventId: event.id,
        dTag,
        name,
        availableTags: tags.map(t => t[0]).join(', '),
      });
      return null;
    }

    const startTime = parseInt(startTimeStr, 10);
    if (isNaN(startTime)) {
      logger.warn('Meetup event has invalid start time', {
        service: 'GenericMeetService',
        method: 'parseMeetupEvent',
        eventId: event.id,
        dTag,
        startTimeStr,
      });
      return null;
    }

    const location = getTag('location');
    if (!location) {
      logger.warn('Meetup event missing location', {
        service: 'GenericMeetService',
        method: 'parseMeetupEvent',
        eventId: event.id,
        dTag,
        name,
        availableTags: tags.map(t => t[0]).join(', '),
      });
      return null;
    }

    // Optional fields
    const endTimeStr = getTag('end');
    const endTime = endTimeStr ? parseInt(endTimeStr, 10) : undefined;

    const timezone = getTag('timezone');
    const geohash = getTag('g');
    const virtualLink = getTag('virtual');
    const meetupType = getTag('meetup-type') || 'other';

    // Parse media attachments from imeta tags (NIP-94)
    const images: Array<{ url: string; mimeType?: string; hash?: string; size?: number }> = [];
    const videos: Array<{ url: string; mimeType?: string; hash?: string; size?: number }> = [];
    const audio: Array<{ url: string; mimeType?: string; hash?: string; size?: number }> = [];

    for (const tag of tags) {
      if (tag[0] === 'imeta') {
        const metaMap = new Map<string, string>();
        for (let i = 1; i < tag.length; i++) {
          const part = tag[i];
          const spaceIndex = part.indexOf(' ');
          if (spaceIndex > 0) {
            const key = part.substring(0, spaceIndex);
            const value = part.substring(spaceIndex + 1);
            metaMap.set(key, value);
          }
        }

        const url = metaMap.get('url');
        const mimeType = metaMap.get('m');
        const hash = metaMap.get('x');
        const sizeStr = metaMap.get('size');
        const size = sizeStr ? parseInt(sizeStr, 10) : undefined;

        if (url) {
          const mediaItem = { url, mimeType, hash, size };
          
          if (mimeType?.startsWith('video/')) {
            videos.push(mediaItem);
          } else if (mimeType?.startsWith('audio/')) {
            audio.push(mediaItem);
          } else {
            images.push(mediaItem);
          }
        }
      }
    }

    // Backward compatibility: Check for old 'image' tag if no imeta tags found
    if (images.length === 0 && videos.length === 0 && audio.length === 0) {
      const legacyImageUrl = getTag('image');
      if (legacyImageUrl) {
        images.push({
          url: legacyImageUrl,
          mimeType: 'image/jpeg',
        });
      }
    }

    const media = {
      images,
      videos,
      audio,
    };

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
      media,
      meetupType,
      tags: userTags,
      hostPubkey,
      coHosts,
      createdAt: event.created_at,
      publishedAt: event.created_at,
    };
  } catch (error) {
    logger.error('Failed to parse meetup event', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericMeetService',
      method: 'parseMeetupEvent',
      eventId: event.id,
    });
    return null;
  }
}

/**
 * Parse an RSVP event from relay
 */
function parseRSVPEvent(event: NostrEvent): ParsedRSVP | null {
  try {
    if (event.kind !== MEETUP_CONFIG.kinds.RSVP) {
      return null;
    }

    const tags = event.tags;
    const getTag = (name: string): string | undefined => {
      const tag = tags.find((t) => t[0] === name);
      return tag ? tag[1] : undefined;
    };

    const dTag = getTag('d');
    if (!dTag) {
      return null;
    }

    const aTag = getTag('a');
    if (!aTag) {
      return null;
    }

    const status = getTag('status') as 'accepted' | 'declined' | 'tentative' | undefined;
    if (!status) {
      return null;
    }

    const eventPubkey = getTag('p');
    if (!eventPubkey) {
      return null;
    }

    // Extract eventDTag from aTag (format: 31923:pubkey:dTag)
    const aTagParts = aTag.split(':');
    if (aTagParts.length !== 3 || aTagParts[0] !== '31923') {
      return null;
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
  } catch (error) {
    logger.error('Failed to parse RSVP event', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericMeetService',
      method: 'parseRSVPEvent',
      eventId: event.id,
    });
    return null;
  }
}

/**
 * Fetch public meetups from relays
 */
export async function fetchPublicMeetups(
  limit = 20,
  until?: number,
  startAfter?: number
): Promise<MeetupCardData[]> {
  try {
    logger.info('Fetching public meetups', {
      service: 'GenericMeetService',
      method: 'fetchPublicMeetups',
      limit,
      until,
      startAfter,
    });

    // Query by kind AND system tag to get only our meetups
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.MEETUP],
      '#t': [MEETUP_CONFIG.systemTag],
      limit,
      until,
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success) {
      logger.error('Failed to fetch meetups', new Error(queryResult.error || 'Query failed'), {
        service: 'GenericMeetService',
        method: 'fetchPublicMeetups',
      });
      return [];
    }

    // Parse and deduplicate by dTag (keep most recent)
    const meetupMap = new Map<string, MeetupEvent>();

    for (const event of queryResult.events) {
      const meetup = parseMeetupEvent(event);
      if (!meetup) continue;

      // Filter by startAfter if provided
      if (startAfter && meetup.startTime < startAfter) {
        continue;
      }

      const existing = meetupMap.get(meetup.dTag);
      if (!existing || meetup.createdAt > existing.createdAt) {
        meetupMap.set(meetup.dTag, meetup);
      }
    }

    // Convert to MeetupCardData
    const meetups = Array.from(meetupMap.values()).map((m) => ({
      id: m.id,
      dTag: m.dTag,
      name: m.name,
      description: m.description,
      startTime: m.startTime,
      endTime: m.endTime,
      location: m.location,
      isVirtual: m.isVirtual,
      media: m.media,
      meetupType: m.meetupType,
      tags: m.tags,
      pubkey: m.pubkey,
      createdAt: m.createdAt,
    }));

    logger.info('Successfully fetched public meetups', {
      service: 'GenericMeetService',
      method: 'fetchPublicMeetups',
      count: meetups.length,
    });

    return meetups;
  } catch (error) {
    logger.error('Failed to fetch public meetups', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericMeetService',
      method: 'fetchPublicMeetups',
    });
    return [];
  }
}

/**
 * Fetch meetups by author
 */
export async function fetchMeetupsByAuthor(pubkey: string): Promise<MeetupEvent[]> {
  try {
    logger.info('Fetching meetups by author', {
      service: 'GenericMeetService',
      method: 'fetchMeetupsByAuthor',
      pubkey: pubkey.substring(0, 8) + '...',
    });

    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.MEETUP],
      authors: [pubkey],
      '#t': [MEETUP_CONFIG.systemTag],
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success) {
      return [];
    }

    // Parse and deduplicate by dTag
    const meetupMap = new Map<string, MeetupEvent>();

    for (const event of queryResult.events) {
      const meetup = parseMeetupEvent(event);
      if (!meetup) continue;

      const existing = meetupMap.get(meetup.dTag);
      if (!existing || meetup.createdAt > existing.createdAt) {
        meetupMap.set(meetup.dTag, meetup);
      }
    }

    return Array.from(meetupMap.values());
  } catch (error) {
    logger.error('Failed to fetch meetups by author', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericMeetService',
      method: 'fetchMeetupsByAuthor',
    });
    return [];
  }
}

/**
 * Fetch a single meetup by dTag
 */
export async function fetchMeetupById(pubkey: string, dTag: string): Promise<MeetupEvent | null> {
  try {
    logger.info('Fetching meetup by dTag', {
      service: 'GenericMeetService',
      method: 'fetchMeetupById',
      dTag,
      pubkey: pubkey ? pubkey.substring(0, 8) + '...' : 'not provided',
    });

    // Query by AUTHOR + d-tag - some relays may not index d-tag alone
    // For NIP-33 parameterized replaceable events, the combination of (kind, pubkey, d-tag) is the unique identifier
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.MEETUP],
      authors: pubkey ? [pubkey] : undefined,
      '#d': [dTag],
      '#t': [MEETUP_CONFIG.systemTag],
      limit: 50, // Increased from 1 to handle replaceable events properly
    };

    logger.info('Querying relays for meetup', {
      service: 'GenericMeetService',
      method: 'fetchMeetupById',
      filter: JSON.stringify(filter),
    });

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    logger.info('Relay query result for meetup', {
      service: 'GenericMeetService',
      method: 'fetchMeetupById',
      success: queryResult.success,
      eventCount: queryResult.events.length,
      relayCount: queryResult.relayCount,
      dTag,
    });

    if (!queryResult.success || queryResult.events.length === 0) {
      logger.warn('Meetup not found', {
        service: 'GenericMeetService',
        method: 'fetchMeetupById',
        dTag,
        success: queryResult.success,
        eventCount: queryResult.events.length,
        error: queryResult.error,
      });
      return null;
    }

    const latestEvent = queryResult.events.sort((a, b) => b.created_at - a.created_at)[0];
    const parsed = parseMeetupEvent(latestEvent);
    
    if (!parsed) {
      logger.error('Failed to parse meetup event', new Error('Parse returned null'), {
        service: 'GenericMeetService',
        method: 'fetchMeetupById',
        dTag,
        eventId: latestEvent.id,
      });
    }
    
    return parsed;
  } catch (error) {
    logger.error('Failed to fetch meetup by ID', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericMeetService',
      method: 'fetchMeetupById',
      dTag,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}

/**
 * Fetch RSVPs for a meetup
 */
export async function fetchMeetupRSVPs(eventPubkey: string, eventDTag: string): Promise<ParsedRSVP[]> {
  try {
    const aTag = MEETUP_CONFIG.rsvp.aTagFormat(eventPubkey, eventDTag);

    // Query by 'a' tag reference to specific meetup
    // DO NOT filter by system tag here - the 'a' tag is already specific to one meetup
    // This allows RSVPs to old meetups (before system tag was added) to still be fetched
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.RSVP],
      '#a': [aTag],
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success) {
      return [];
    }

    // Deduplicate RSVPs by pubkey (keep most recent per user)
    const rsvpMap = new Map<string, ParsedRSVP>();

    for (const event of queryResult.events) {
      const rsvp = parseRSVPEvent(event);
      if (!rsvp) continue;

      const existing = rsvpMap.get(rsvp.pubkey);
      if (!existing || rsvp.timestamp > existing.timestamp) {
        rsvpMap.set(rsvp.pubkey, rsvp);
      }
    }

    return Array.from(rsvpMap.values());
  } catch (error) {
    logger.error('Failed to fetch RSVPs', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericMeetService',
      method: 'fetchMeetupRSVPs',
    });
    return [];
  }
}

/**
 * Fetch RSVPs by user
 */
export async function fetchUserRSVPs(pubkey: string): Promise<ParsedRSVP[]> {
  try {
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.RSVP],
      authors: [pubkey],
      '#t': [MEETUP_CONFIG.systemTag],
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success) {
      return [];
    }

    // Deduplicate RSVPs by eventDTag (keep most recent per meetup)
    const rsvpMap = new Map<string, ParsedRSVP>();

    for (const event of queryResult.events) {
      const rsvp = parseRSVPEvent(event);
      if (!rsvp) continue;

      const existing = rsvpMap.get(rsvp.eventDTag);
      if (!existing || rsvp.timestamp > existing.timestamp) {
        rsvpMap.set(rsvp.eventDTag, rsvp);
      }
    }

    return Array.from(rsvpMap.values());
  } catch (error) {
    logger.error('Failed to fetch user RSVPs', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericMeetService',
      method: 'fetchUserRSVPs',
    });
    return [];
  }
}
