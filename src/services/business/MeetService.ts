import type {
  MeetupData,
  MeetupEvent,
  MeetupPublishingResult,
  RSVPData,
  ParsedRSVP,
} from '@/types/meetup';
import type { NostrEvent, NostrSigner } from '@/types/nostr';
import { queryEvents, publishEvent } from '@/services/generic/GenericRelayService';
import {
  fetchPublicMeetups,
  fetchMeetupsByAuthor,
  fetchMeetupById,
  fetchMeetupRSVPs,
  fetchUserRSVPs,
} from '@/services/generic/GenericMeetService';
import { 
  createCalendarEvent, 
  createRSVPEvent, 
  createDeletionEvent,
  signEvent 
} from '@/services/generic/GenericEventService';
import { MEETUP_CONFIG } from '@/config/meetup';
import type { Filter } from 'nostr-tools';

/**
 * MeetService
 * Business logic layer for meetup operations
 * Layer: Business Service
 * Dependencies: GenericEventService (Event), GenericRelayService, GenericMeetService (Generic)
 */

/**
 * Publish a new meetup
 */
export async function publishMeetup(
  data: MeetupData,
  signer: NostrSigner
): Promise<MeetupPublishingResult> {
  try {
    const pubkey = await signer.getPublicKey();

    // Create the calendar event using GenericEventService
    const eventResult = createCalendarEvent(
      {
        name: data.name,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: data.timezone,
        location: data.location,
        geohash: data.geohash,
        isVirtual: data.isVirtual,
        virtualLink: data.virtualLink,
        imageUrl: data.imageUrl,
        meetupType: data.meetupType,
        tags: data.tags,
        hostPubkey: data.hostPubkey,
        coHosts: data.coHosts,
      },
      pubkey,
      { systemTag: MEETUP_CONFIG.systemTag }
    );

    if (!eventResult.success || !eventResult.event) {
      return {
        success: false,
        error: eventResult.error || 'Failed to create calendar event',
      };
    }

    // Sign the event
    const signResult = await signEvent(eventResult.event, signer);
    
    if (!signResult.success || !signResult.signedEvent) {
      return {
        success: false,
        error: signResult.error || 'Failed to sign event',
      };
    }

    // Publish to relays
    const publishResult = await publishEvent(signResult.signedEvent, signer);

    return {
      success: publishResult.success,
      eventId: publishResult.eventId,
      dTag: eventResult.dTag,
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
    const pubkey = await signer.getPublicKey();

    // Create the calendar event with existing dTag
    const eventResult = createCalendarEvent(
      {
        name: data.name,
        description: data.description,
        startTime: data.startTime,
        endTime: data.endTime,
        timezone: data.timezone,
        location: data.location,
        geohash: data.geohash,
        isVirtual: data.isVirtual,
        virtualLink: data.virtualLink,
        imageUrl: data.imageUrl,
        meetupType: data.meetupType,
        tags: data.tags,
        hostPubkey: data.hostPubkey,
        coHosts: data.coHosts,
      },
      pubkey,
      { dTag: existingDTag, systemTag: MEETUP_CONFIG.systemTag }
    );

    if (!eventResult.success || !eventResult.event) {
      return {
        success: false,
        error: eventResult.error || 'Failed to create calendar event',
      };
    }

    // Sign the event
    const signResult = await signEvent(eventResult.event, signer);
    
    if (!signResult.success || !signResult.signedEvent) {
      return {
        success: false,
        error: signResult.error || 'Failed to sign event',
      };
    }

    // Publish to relays (will replace old event due to NIP-33)
    const publishResult = await publishEvent(signResult.signedEvent, signer);

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

    // Create deletion event using GenericEventService
    const deletionResult = createDeletionEvent(eventIds, pubkey, { reason });

    if (!deletionResult.success || !deletionResult.event) {
      return {
        success: false,
        error: deletionResult.error || 'Failed to create deletion event',
      };
    }

    // Sign the deletion event
    const signResult = await signEvent(deletionResult.event, signer);
    
    if (!signResult.success || !signResult.signedEvent) {
      return {
        success: false,
        error: signResult.error || 'Failed to sign deletion event',
      };
    }

    // Publish deletion to all relays
    const publishResult = await publishEvent(signResult.signedEvent, signer);

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
  // Delegate to GenericMeetService
  const cardData = await fetchPublicMeetups(options?.limit, options?.until);
  
  // Convert MeetupCardData to MeetupEvent (add missing fields)
  return cardData.map(card => ({
    ...card,
    description: card.description,
    timezone: undefined,
    geohash: undefined,
    virtualLink: undefined,
    hostPubkey: card.pubkey,
    coHosts: undefined,
    publishedAt: card.createdAt,
  }));
}

/**
 * Fetch a single meetup by dTag and pubkey
 */
export async function fetchMeetupByDTag(
  pubkey: string,
  dTag: string
): Promise<MeetupEvent | null> {
  // Delegate to GenericMeetService
  return fetchMeetupById(pubkey, dTag);
}

/**
 * Fetch meetups created by a specific user
 */
export async function fetchUserMeetups(pubkey: string): Promise<MeetupEvent[]> {
  // Delegate to GenericMeetService
  return fetchMeetupsByAuthor(pubkey);
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
    const pubkey = await signer.getPublicKey();

    // Create RSVP event using GenericEventService
    const rsvpResult = createRSVPEvent(
      {
        eventDTag: data.eventDTag,
        eventPubkey: data.eventPubkey,
        status: data.status,
        comment: data.comment,
      },
      pubkey
    );

    if (!rsvpResult.success || !rsvpResult.event) {
      return {
        success: false,
        error: rsvpResult.error || 'Failed to create RSVP event',
      };
    }

    // Sign the event
    const signResult = await signEvent(rsvpResult.event, signer);
    
    if (!signResult.success || !signResult.signedEvent) {
      return {
        success: false,
        error: signResult.error || 'Failed to sign RSVP event',
      };
    }

    // Publish to relays (will replace any existing RSVP due to deterministic dTag)
    const publishResult = await publishEvent(signResult.signedEvent, signer);

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

    // Create deletion event using GenericEventService
    const deletionResult = createDeletionEvent(eventIds, pubkey, { reason });

    if (!deletionResult.success || !deletionResult.event) {
      return {
        success: false,
        error: deletionResult.error || 'Failed to create deletion event',
      };
    }

    // Sign the deletion event
    const signResult = await signEvent(deletionResult.event, signer);
    
    if (!signResult.success || !signResult.signedEvent) {
      return {
        success: false,
        error: signResult.error || 'Failed to sign deletion event',
      };
    }

    // Publish deletion
    const publishResult = await publishEvent(signResult.signedEvent, signer);

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
export async function fetchMeetupRSVPsForMeetup(
  eventPubkey: string,
  eventDTag: string
): Promise<ParsedRSVP[]> {
  // Delegate to GenericMeetService
  return fetchMeetupRSVPs(eventPubkey, eventDTag);
}

/**
 * Fetch RSVPs created by a specific user
 */
export async function fetchRSVPsByUser(pubkey: string): Promise<ParsedRSVP[]> {
  // Delegate to GenericMeetService
  return fetchUserRSVPs(pubkey);
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
