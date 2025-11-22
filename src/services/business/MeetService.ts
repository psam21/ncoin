import type {
  MeetupData,
  MeetupEvent,
  MeetupPublishingResult,
  MeetupPublishingProgress,
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
import { logger } from '@/services/core/LoggingService';
import { validateMeetupData } from '@/services/business/MeetValidationService';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';

/**
 * MeetService
 * Business logic layer for meetup operations
 * Layer: Business Service
 * Dependencies: GenericEventService (Event), GenericRelayService, GenericMeetService (Generic)
 */

/**
 * Create a new meetup with image upload, event creation and publishing
 * Matches plan signature and includes Blossom image upload orchestration
 * 
 * @param meetupData - Meetup data
 * @param imageFile - Optional event image
 * @param signer - Nostr signer
 * @param existingDTag - Optional dTag for updates
 * @param onProgress - Optional callback for progress updates
 */
export async function createMeetup(
  meetupData: MeetupData,
  imageFile: File | null,
  signer: NostrSigner,
  existingDTag?: string,
  onProgress?: (progress: MeetupPublishingProgress) => void
): Promise<MeetupPublishingResult> {
  try {
    logger.info('Starting meetup creation', {
      service: 'MeetService',
      method: 'createMeetup',
      name: meetupData.name,
      isEdit: !!existingDTag,
      hasImage: !!imageFile,
    });

    // Step 1: Validate meetup data
    onProgress?.({
      step: 'validating',
      progress: 10,
      message: 'Validating meetup...',
      details: 'Checking required fields',
    });

    const validation = validateMeetupData(meetupData);
    if (!validation.valid) {
      const errorMsg = Object.values(validation.errors).join(', ');
      logger.error('Meetup validation failed', new Error(errorMsg), {
        service: 'MeetService',
        method: 'createMeetup',
        errors: validation.errors,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    // Step 2: Upload image file (if provided)
    let imageUrl = meetupData.imageUrl;

    if (imageFile) {
      onProgress?.({
        step: 'uploading',
        progress: 30,
        message: 'Uploading event image...',
        details: imageFile.name,
      });

      logger.info('Uploading event image', {
        service: 'MeetService',
        method: 'createMeetup',
        fileName: imageFile.name,
        fileSize: imageFile.size,
      });

      const uploadResult = await uploadSequentialWithConsent(
        [imageFile],
        signer,
        (uploadProgress) => {
          // Map upload progress (0-1) to publishing progress (30-70)
          const progressPercent = 30 + (40 * uploadProgress.overallProgress);
          onProgress?.({
            step: 'uploading',
            progress: progressPercent,
            message: uploadProgress.nextAction,
            details: imageFile.name,
          });
        }
      );

      // Check for cancellation or failure
      if (uploadResult.userCancelled) {
        return {
          success: false,
          error: 'User cancelled image upload',
        };
      }

      if (uploadResult.successCount === 0) {
        return {
          success: false,
          error: 'Image upload failed',
        };
      }

      imageUrl = uploadResult.uploadedFiles[0].url;

      logger.info('Image upload completed', {
        service: 'MeetService',
        method: 'createMeetup',
        imageUrl,
      });
    }

    // Step 3: Create calendar event
    onProgress?.({
      step: 'publishing',
      progress: 75,
      message: 'Creating meetup event...',
      details: 'Signing event',
    });

    const pubkey = await signer.getPublicKey();

    const eventResult = createCalendarEvent(
      {
        ...meetupData,
        imageUrl,
      },
      pubkey,
      existingDTag
        ? { dTag: existingDTag, systemTag: MEETUP_CONFIG.systemTag }
        : { systemTag: MEETUP_CONFIG.systemTag }
    );

    if (!eventResult.success || !eventResult.event) {
      return {
        success: false,
        error: eventResult.error || 'Failed to create calendar event',
      };
    }

    // Step 4: Sign the event
    const signResult = await signEvent(eventResult.event, signer);
    
    if (!signResult.success || !signResult.signedEvent) {
      return {
        success: false,
        error: signResult.error || 'Failed to sign event',
      };
    }

    // Step 5: Publish to relays
    onProgress?.({
      step: 'publishing',
      progress: 90,
      message: 'Publishing to relays...',
      details: 'Broadcasting event',
    });

    const publishResult = await publishEvent(signResult.signedEvent, signer);

    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Meetup published successfully!',
      details: `Published to ${publishResult.publishedRelays?.length || 0} relays`,
    });

    logger.info('Meetup creation completed', {
      service: 'MeetService',
      method: 'createMeetup',
      success: publishResult.success,
      publishedRelays: publishResult.publishedRelays?.length,
    });

    return {
      success: publishResult.success,
      eventId: publishResult.eventId,
      dTag: eventResult.dTag,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    logger.error('Meetup creation failed', error instanceof Error ? error : new Error(String(error)), {
      service: 'MeetService',
      method: 'createMeetup',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Publish a new meetup (backward compatibility wrapper)
 * Use createMeetup() for new implementations
 */
export async function publishMeetup(
  data: MeetupData,
  signer: NostrSigner
): Promise<MeetupPublishingResult> {
  return createMeetup(data, null, signer);
}

/**
 * Update an existing meetup with full image upload support
 * Delegates to createMeetup with existingDTag for NIP-33 replacement
 * 
 * @param data - Updated meetup data
 * @param existingDTag - The dTag of the meetup to update
 * @param imageFile - Optional new event image (replaces existing)
 * @param signer - Nostr signer
 * @param onProgress - Optional progress callback
 */
export async function updateMeetup(
  data: MeetupData,
  existingDTag: string,
  imageFile: File | null,
  signer: NostrSigner,
  onProgress?: (progress: MeetupPublishingProgress) => void
): Promise<MeetupPublishingResult> {
  logger.info('Updating meetup', {
    service: 'MeetService',
    method: 'updateMeetup',
    dTag: existingDTag,
    hasNewImage: !!imageFile,
  });

  // Delegate to createMeetup with existingDTag for NIP-33 replacement
  return createMeetup(data, imageFile, signer, existingDTag, onProgress);
}

/**
 * Delete a meetup by publishing NIP-09 deletion event
 * Matches plan signature: eventId first, correct parameter order
 * 
 * @param eventId - The event ID to delete (for targeted deletion)
 * @param signer - Nostr signer
 * @param pubkey - Author's public key
 * @param title - Meetup title (for deletion reason)
 */
export async function deleteMeetup(
  eventId: string,
  signer: NostrSigner,
  pubkey: string,
  title: string
): Promise<MeetupPublishingResult> {
  try {
    logger.info('Deleting meetup', {
      service: 'MeetService',
      method: 'deleteMeetup',
      eventId,
      title,
    });

    // Create deletion event using GenericEventService
    const reason = `Deleted meetup: ${title}`;
    const deletionResult = createDeletionEvent([eventId], pubkey, { reason });

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

    logger.info('Meetup deletion completed', {
      service: 'MeetService',
      method: 'deleteMeetup',
      success: publishResult.success,
      publishedRelays: publishResult.publishedRelays?.length,
    });

    return {
      success: publishResult.success,
      eventId: publishResult.eventId,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    logger.error('Meetup deletion failed', error instanceof Error ? error : new Error(String(error)), {
      service: 'MeetService',
      method: 'deleteMeetup',
      eventId,
    });
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
