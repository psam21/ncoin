import type {
  MeetupData,
  MeetupEvent,
  MeetupPublishingResult,
  RSVPData,
  ParsedRSVP,
} from '@/types/meetup';
import type { NostrEvent, NostrSigner } from '@/types/nostr';
import { MeetupEventService } from '@/services/nostr/MeetupEventService';
import { queryEvents, publishEvent } from '@/services/generic/GenericRelayService';
import { MEETUP_CONFIG } from '@/config/meetup';
import type { Filter } from 'nostr-tools';

/**
 * MeetService
 * Business logic layer for meetup operations
 * Layer: Business Service
 * Dependencies: MeetupEventService (Event), GenericRelayService (Generic)
 */

/**
 * Publish a new meetup
 */
export async function publishMeetup(
  data: MeetupData,
  signer: NostrSigner
): Promise<MeetupPublishingResult> {
  try {
    // Create the event
    const unsignedEvent = await MeetupEventService.createMeetupEvent(data, signer);

    // Sign and publish
    const publishResult = await publishEvent(unsignedEvent, signer);

    // Extract dTag from event
    const dTag = unsignedEvent.tags.find((t: string[]) => t[0] === 'd')?.[1];

    return {
      success: publishResult.success,
      eventId: publishResult.eventId,
      dTag,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an existing meetup (republish with same dTag)
 */
export async function updateMeetup(
  data: MeetupData,
  existingDTag: string,
  signer: NostrSigner
): Promise<MeetupPublishingResult> {
  try {
    // Create the event
    let unsignedEvent = await MeetupEventService.createMeetupEvent(data, signer);

    // Replace the auto-generated dTag with the existing one
    unsignedEvent = {
      ...unsignedEvent,
      tags: unsignedEvent.tags.map((tag: string[]) =>
        tag[0] === 'd' ? ['d', existingDTag] : tag
      ),
    };

    // Sign and publish
    const publishResult = await publishEvent(unsignedEvent, signer);

    return {
      success: publishResult.success,
      eventId: publishResult.eventId,
      dTag: existingDTag,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a meetup (publish Kind 5 deletion event)
 * Query all relays for event IDs before deleting
 */
export async function deleteMeetup(
  pubkey: string,
  dTag: string,
  signer: NostrSigner,
  reason?: string
): Promise<MeetupPublishingResult> {
  try {
    // Query all relays for events with this dTag
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.MEETUP],
      authors: [pubkey],
      '#d': [dTag],
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);
    
    if (!queryResult.success || queryResult.events.length === 0) {
      return {
        success: false,
        error: 'No events found to delete',
      };
    }

    // Collect all event IDs
    const eventIds = queryResult.events.map((e: NostrEvent) => e.id).filter((id): id is string => !!id);

    if (eventIds.length === 0) {
      return {
        success: false,
        error: 'No valid event IDs found',
      };
    }

    // Create deletion event
    const deletionEvent = await MeetupEventService.createDeletionEvent(
      eventIds,
      signer,
      reason
    );

    // Publish deletion to all relays
    const publishResult = await publishEvent(deletionEvent, signer);

    return {
      success: publishResult.success,
      eventId: publishResult.eventId,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch all meetups (public feed)
 */
export async function fetchMeetups(options?: {
  limit?: number;
  since?: number;
  until?: number;
}): Promise<MeetupEvent[]> {
  try {
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.MEETUP],
      '#t': [MEETUP_CONFIG.systemTag],
      limit: options?.limit,
      since: options?.since,
      until: options?.until,
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success) {
      return [];
    }

    // Parse and deduplicate by dTag (keep most recent)
    const meetupMap = new Map<string, MeetupEvent>();

    for (const event of queryResult.events) {
      try {
        const meetup = MeetupEventService.parseMeetupEvent(event);
        
        const existing = meetupMap.get(meetup.dTag);
        if (!existing || meetup.createdAt > existing.createdAt) {
          meetupMap.set(meetup.dTag, meetup);
        }
      } catch (error) {
        console.error('Failed to parse meetup event:', error);
      }
    }

    return Array.from(meetupMap.values());
  } catch (error) {
    console.error('Failed to fetch meetups:', error);
    return [];
  }
}

/**
 * Fetch a single meetup by dTag and pubkey
 */
export async function fetchMeetupByDTag(
  pubkey: string,
  dTag: string
): Promise<MeetupEvent | null> {
  try {
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.MEETUP],
      authors: [pubkey],
      '#d': [dTag],
      limit: 1,
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success || queryResult.events.length === 0) {
      return null;
    }

    // Get the most recent event
    const latestEvent = queryResult.events.sort((a: NostrEvent, b: NostrEvent) => b.created_at - a.created_at)[0];
    return MeetupEventService.parseMeetupEvent(latestEvent);
  } catch (error) {
    console.error('Failed to fetch meetup:', error);
    return null;
  }
}

/**
 * Fetch meetups created by a specific user
 */
export async function fetchUserMeetups(
  pubkey: string,
  options?: { limit?: number }
): Promise<MeetupEvent[]> {
  try {
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.MEETUP],
      authors: [pubkey],
      '#t': [MEETUP_CONFIG.systemTag],
      limit: options?.limit,
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success) {
      return [];
    }

    // Parse and deduplicate by dTag
    const meetupMap = new Map<string, MeetupEvent>();

    for (const event of queryResult.events) {
      try {
        const meetup = MeetupEventService.parseMeetupEvent(event);
        
        const existing = meetupMap.get(meetup.dTag);
        if (!existing || meetup.createdAt > existing.createdAt) {
          meetupMap.set(meetup.dTag, meetup);
        }
      } catch (error) {
        console.error('Failed to parse meetup event:', error);
      }
    }

    return Array.from(meetupMap.values());
  } catch (error) {
    console.error('Failed to fetch user meetups:', error);
    return [];
  }
}

/**
 * Create/update an RSVP to a meetup
 * Uses NIP-33 replaceability - same dTag replaces previous RSVP
 */
export async function rsvpToMeetup(
  data: RSVPData,
  signer: NostrSigner
): Promise<MeetupPublishingResult> {
  try {
    // Create RSVP event
    const unsignedEvent = await MeetupEventService.createRSVPEvent(data, signer);

    // Sign and publish (will replace any existing RSVP due to deterministic dTag)
    const publishResult = await publishEvent(unsignedEvent, signer);

    return {
      success: publishResult.success,
      eventId: publishResult.eventId,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete an RSVP
 * Query all relays first, then publish Kind 5 deletion with all event IDs
 */
export async function deleteRSVP(
  eventDTag: string,
  signer: NostrSigner,
  reason?: string
): Promise<MeetupPublishingResult> {
  try {
    const pubkey = await signer.getPublicKey();
    const rsvpDTag = MEETUP_CONFIG.rsvp.dTagFormat(eventDTag);

    // Query all relays for RSVP events with this dTag
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.RSVP],
      authors: [pubkey],
      '#d': [rsvpDTag],
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success || queryResult.events.length === 0) {
      return {
        success: false,
        error: 'No RSVP found to delete',
      };
    }

    // Collect all event IDs
    const eventIds = queryResult.events.map((e: NostrEvent) => e.id).filter((id): id is string => !!id);

    if (eventIds.length === 0) {
      return {
        success: false,
        error: 'No valid event IDs found',
      };
    }

    // Create deletion event
    const deletionEvent = await MeetupEventService.createDeletionEvent(
      eventIds,
      signer,
      reason
    );

    // Publish deletion
    const publishResult = await publishEvent(deletionEvent, signer);

    return {
      success: publishResult.success,
      eventId: publishResult.eventId,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch RSVPs for a specific meetup
 */
export async function fetchMeetupRSVPs(
  eventPubkey: string,
  eventDTag: string
): Promise<ParsedRSVP[]> {
  try {
    const aTag = MEETUP_CONFIG.rsvp.aTagFormat(eventPubkey, eventDTag);

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
      try {
        const rsvp = MeetupEventService.parseRSVPEvent(event);
        
        const existing = rsvpMap.get(rsvp.pubkey);
        if (!existing || rsvp.timestamp > existing.timestamp) {
          rsvpMap.set(rsvp.pubkey, rsvp);
        }
      } catch (error) {
        console.error('Failed to parse RSVP event:', error);
      }
    }

    return Array.from(rsvpMap.values());
  } catch (error) {
    console.error('Failed to fetch RSVPs:', error);
    return [];
  }
}

/**
 * Fetch RSVPs created by a specific user
 */
export async function fetchUserRSVPs(pubkey: string): Promise<ParsedRSVP[]> {
  try {
    const filter: Filter = {
      kinds: [MEETUP_CONFIG.kinds.RSVP],
      authors: [pubkey],
    };

    const queryResult = await queryEvents([filter as Record<string, unknown>]);

    if (!queryResult.success) {
      return [];
    }

    // Deduplicate RSVPs by eventDTag (keep most recent per meetup)
    const rsvpMap = new Map<string, ParsedRSVP>();

    for (const event of queryResult.events) {
      try {
        const rsvp = MeetupEventService.parseRSVPEvent(event);
        
        const existing = rsvpMap.get(rsvp.eventDTag);
        if (!existing || rsvp.timestamp > existing.timestamp) {
          rsvpMap.set(rsvp.eventDTag, rsvp);
        }
      } catch (error) {
        console.error('Failed to parse RSVP event:', error);
      }
    }

    return Array.from(rsvpMap.values());
  } catch (error) {
    console.error('Failed to fetch user RSVPs:', error);
    return [];
  }
}

/**
 * Get RSVP count summary for a meetup
 */
export function getRSVPCounts(rsvps: ParsedRSVP[]) {
  return {
    accepted: rsvps.filter((r) => r.status === 'accepted').length,
    declined: rsvps.filter((r) => r.status === 'declined').length,
    tentative: rsvps.filter((r) => r.status === 'tentative').length,
  };
}

/**
 * Filter upcoming meetups
 */
export function filterUpcomingMeetups(meetups: MeetupEvent[]): MeetupEvent[] {
  const now = Math.floor(Date.now() / 1000);
  return meetups
    .filter((m) => m.startTime > now)
    .sort((a, b) => a.startTime - b.startTime);
}

/**
 * Filter past meetups
 */
export function filterPastMeetups(meetups: MeetupEvent[]): MeetupEvent[] {
  const now = Math.floor(Date.now() / 1000);
  return meetups
    .filter((m) => m.startTime <= now)
    .sort((a, b) => b.startTime - a.startTime);
}
