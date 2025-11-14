import { logger } from '@/services/core/LoggingService';
import type { ContributionData, ContributionPublishingProgress } from '@/types/contributions';
import { validateContributionData } from './ContributionValidationService';
import { nostrEventService } from '../nostr/NostrEventService';
import type { NostrSigner, NostrEvent } from '@/types/nostr';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';
import { fetchPublicContributions as fetchPublicContributionsFromRelay, type ContributionEvent } from '@/services/generic/GenericContributionService';
import { getRelativeTime } from '@/utils/dateUtils';
import { queryEvents } from '@/services/generic/GenericRelayService';
import { createDeletionEvent, signEvent } from '@/services/generic/GenericEventService';

export interface CreateContributionResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  error?: string;
  [key: string]: unknown; // For generic wrapper compatibility
}

/**
 * Create a new nomad contribution with file upload, event creation and publishing
 * Orchestrates: validation → upload → event creation → publishing
 * 
 * @param contributionData - Contribution data (attachments can be empty, will be populated from files)
 * @param attachmentFiles - File objects to upload (empty array if no files)
 * @param signer - Nostr signer for signing events and uploads
 * @param existingDTag - Optional dTag for updates (undefined for new contributions)
 * @param onProgress - Optional callback for progress updates
 */
export async function createContribution(
  contributionData: ContributionData,
  attachmentFiles: File[],
  signer: NostrSigner,
  existingDTag?: string,
  onProgress?: (progress: ContributionPublishingProgress) => void
): Promise<CreateContributionResult> {
  try {
    console.log('[ContributionService] createContribution called', {
      attachmentFilesCount: attachmentFiles.length,
      isEdit: !!existingDTag,
    });
    
    logger.info('Starting contribution creation', {
      service: 'ContributionService',
      method: 'createContribution',
      title: contributionData.title,
      isEdit: !!existingDTag,
      attachmentFilesCount: attachmentFiles.length,
    });

    // Step 1: Validate contribution data
    console.log('[ContributionService] Reporting validation progress');
    onProgress?.({
      step: 'validating',
      progress: 10,
      message: 'Validating contribution...',
      details: 'Checking required fields',
    });

    console.log('[ContributionService] Calling validateContributionData');
    const validation = validateContributionData(contributionData);
    console.log('[ContributionService] Validation result', { valid: validation.valid });
    if (!validation.valid) {
      const errorMsg = Object.values(validation.errors).join(', ');
      logger.error('Contribution validation failed', new Error(errorMsg), {
        service: 'ContributionService',
        method: 'createContribution',
        errors: validation.errors,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    // Step 2: Upload attachment files (if any)
    const uploadedAttachments: Array<{
      type: 'image' | 'video' | 'audio';
      url: string;
      hash: string;
      name: string;
      id: string;
      size: number;
      mimeType: string;
    }> = [];

    if (attachmentFiles.length > 0) {
      onProgress?.({
        step: 'uploading',
        progress: 30,
        message: 'Uploading media files...',
        details: `Uploading ${attachmentFiles.length} file(s)`,
      });

      logger.info('Uploading attachment files', {
        service: 'ContributionService',
        method: 'createContribution',
        fileCount: attachmentFiles.length,
      });

      const uploadResult = await uploadSequentialWithConsent(
        attachmentFiles,
        signer,
        (uploadProgress) => {
          // Map upload progress (0-1) to publishing progress (30-70)
          const progressPercent = 30 + (40 * uploadProgress.overallProgress);
          onProgress?.({
            step: 'uploading',
            progress: progressPercent,
            message: uploadProgress.nextAction,
            details: `File ${uploadProgress.currentFileIndex + 1} of ${uploadProgress.totalFiles}`,
            attachmentProgress: {
              current: uploadProgress.currentFileIndex + 1,
              total: uploadProgress.totalFiles,
              currentFile: uploadProgress.currentFile.name,
            },
          });
        }
      );

      // Check for cancellation or failure
      if (uploadResult.userCancelled) {
        return {
          success: false,
          error: 'User cancelled upload',
        };
      }

      if (uploadResult.successCount === 0) {
        return {
          success: false,
          error: 'All media uploads failed',
        };
      }

      // Map uploaded files to attachment format
      for (let i = 0; i < uploadResult.uploadedFiles.length; i++) {
        const uploadedFile = uploadResult.uploadedFiles[i];
        const originalFile = attachmentFiles[i];
        
        // Determine media type from MIME type
        const mimeType = originalFile.type;
        let type: 'image' | 'video' | 'audio' = 'image';
        if (mimeType.startsWith('video/')) type = 'video';
        else if (mimeType.startsWith('audio/')) type = 'audio';

        uploadedAttachments.push({
          type,
          url: uploadedFile.url,
          hash: uploadedFile.hash,
          name: originalFile.name,
          id: `${uploadedFile.hash}-${Date.now()}`, // Generate unique ID
          size: originalFile.size,
          mimeType,
        });
      }

      logger.info('Media uploaded successfully', {
        service: 'ContributionService',
        method: 'createContribution',
        uploadedCount: uploadResult.successCount,
        failedCount: uploadResult.failureCount,
      });
    }

    // Step 3: Merge uploaded attachments with existing attachments in contributionData
    const allAttachments = uploadedAttachments.map(att => ({
      id: att.id,
      url: att.url,
      type: att.type,
      hash: att.hash,
      name: att.name,
      size: att.size,
      mimeType: att.mimeType,
    }));

    // Map GenericAttachment to simplified format for event service
    const mappedAttachments = allAttachments
      .filter(att => att.url) // Only include attachments with URLs
      .map(att => ({
        url: att.url!,
        type: att.type,
        hash: att.hash,
        name: att.name,
        size: att.size,
        mimeType: att.mimeType,
      }));

    // Step 4: Create Nostr event using contribution-specific method
    onProgress?.({
      step: 'publishing',
      progress: 70,
      message: 'Creating Nostr event...',
      details: 'Signing and creating event',
    });

    logger.info('Creating contribution event', {
      service: 'ContributionService',
      method: 'createContribution',
      title: contributionData.title,
      dTag: existingDTag,
    });

    const event = await nostrEventService.createContributionEvent(
      {
        title: contributionData.title,
        description: contributionData.description,
        category: contributionData.category,
        contributionType: contributionData.contributionType,
        language: contributionData.language || 'en',
        location: contributionData.location || '',
        region: contributionData.region,
        country: contributionData.country,
        tags: contributionData.tags,
        attachments: mappedAttachments,
      },
      signer,
      existingDTag
    );

    // Step 5: Publish to relays (optimistic - return on first success, continue in background)
    onProgress?.({
      step: 'publishing',
      progress: 85,
      message: 'Publishing to relays...',
      details: 'Broadcasting event',
    });

    logger.info('Publishing event to relays with optimistic return', {
      service: 'ContributionService',
      method: 'createContribution',
      eventId: event.id,
      title: contributionData.title,
    });

    // Extract dTag before publishing
    const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
    if (!dTag) {
      throw new Error('Created event missing required d tag');
    }

    // Start publishing - this runs in parallel to all relays
    const publishPromise = nostrEventService.publishEvent(
      event,
      signer,
      (relay, status) => {
        logger.info('Relay publishing status', {
          service: 'ContributionService',
          method: 'createContribution',
          relay,
          status,
          eventId: event.id,
        });
      }
    );

    // Create a race condition: return as soon as we have first confirmation OR all complete
    const firstSuccessPromise = new Promise<CreateContributionResult>((resolve) => {
      let resolvedEarly = false;
      const publishedRelays: string[] = [];
      
      // Monitor progress and resolve early on first success
      const progressHandler = (relay: string, status: 'publishing' | 'success' | 'failed') => {
        if (status === 'success' && !resolvedEarly) {
          publishedRelays.push(relay);
          // Return immediately with partial result
          resolvedEarly = true;
          resolve({
            success: true,
            eventId: event.id,
            dTag,
            publishedRelays: [relay],
            failedRelays: [],
          });
        }
      };
      
      // Re-publish with progress monitoring
      nostrEventService.publishEvent(event, signer, progressHandler);
    });

    // Wait for either first success or full completion (whichever comes first)
    const publishResult = await Promise.race([
      firstSuccessPromise,
      publishPromise.then((result): CreateContributionResult => ({
        success: result.success,
        eventId: result.eventId,
        dTag,
        publishedRelays: result.publishedRelays,
        failedRelays: result.failedRelays,
      })),
    ]);

    // Background: Continue publishing to remaining relays (non-blocking)
    publishPromise.then((finalResult) => {
      logger.info('Background relay publishing completed', {
        service: 'ContributionService',
        method: 'createContribution',
        eventId: event.id,
        finalPublishedCount: finalResult.publishedRelays.length,
        finalFailedCount: finalResult.failedRelays.length,
      });
    }).catch((err) => {
      logger.warn('Background relay publishing encountered errors', {
        service: 'ContributionService',
        method: 'createContribution',
        eventId: event.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    });

    // We consider it success if at least one relay confirms
    if (!publishResult.success) {
      return {
        success: false,
        error: `Failed to publish to any relay: ${publishResult.error}`,
        eventId: event.id,
        dTag,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    // Step 6: Report completion
    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Contribution published!',
      details: `Successfully published to ${publishResult.publishedRelays?.length || 1} relays`,
    });

    logger.info('Contribution created successfully', {
      service: 'ContributionService',
      method: 'createContribution',
      eventId: event.id,
      dTag,
      title: contributionData.title,
      publishedRelays: publishResult.publishedRelays?.length || 1,
    });

    return {
      success: true,
      eventId: event.id,
      dTag,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    logger.error('Failed to create contribution', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'ContributionService',
      method: 'createContribution',
      title: contributionData.title,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error creating contribution',
    };
  }
}

/**
 * Contribution explore item for listing view
 */
export interface ContributionExploreItem {
  id: string;
  dTag: string;
  name: string;
  location: string;
  region: string;
  image: string;
  contributors: number;
  mediaCount: number;
  tags: string[];
  description: string;
  category: string;
  publishedAt: number;
  relativeTime: string;
  pubkey: string; // Author's pubkey for contact functionality
}

/**
 * Transform contribution event to contribution explore item
 */
function mapToExploreItem(event: ContributionEvent): ContributionExploreItem {
  const totalMedia = 
    event.media.images.length +
    event.media.audio.length +
    event.media.videos.length;
  
  const image = event.media.images[0] || 
                event.media.videos[0] || 
                'https://images.unsplash.com/photo-1606114701010-e2b90b5ab7d8?w=400&h=300&fit=crop';
  
  return {
    id: event.id,
    dTag: event.dTag,
    name: event.title,
    location: event.region || event.location || 'Unknown Location',
    region: event.region || 'Unknown Region',
    image,
    contributors: 1,
    mediaCount: totalMedia,
    tags: event.tags,
    description: event.summary,
    category: event.category,
    publishedAt: event.publishedAt,
    relativeTime: getRelativeTime(event.publishedAt),
    pubkey: event.pubkey,
  };
}

/**
 * Fetch public contributions for explore/listing view
 * Business layer method that orchestrates fetching and data transformation
 * 
 * @param limit - Maximum number of contributions to fetch
 * @param until - Optional timestamp for pagination (fetch contributions before this time)
 * @returns Array of contribution explore items ready for display
 */
export async function fetchPublicContributions(
  limit: number = 8,
  until?: number
): Promise<ContributionExploreItem[]> {
  try {
    logger.info('Fetching public contributions', {
      service: 'ContributionService',
      method: 'fetchPublicContributions',
      limit,
      until,
      hasPagination: !!until,
    });

    // Fetch from generic service
    const events = await fetchPublicContributionsFromRelay(limit, until);
    
    // Transform to explore items (business logic)
    const items = events.map(mapToExploreItem);
    
    logger.info('Public contributions fetched and transformed', {
      service: 'ContributionService',
      method: 'fetchPublicContributions',
      itemCount: items.length,
    });

    return items;
  } catch (error) {
    logger.error('Failed to fetch public contributions', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'ContributionService',
      method: 'fetchPublicContributions',
      limit,
      until,
    });
    
    // Return empty array on error (hook will handle error state)
    return [];
  }
}

/**
 * Fetch contributions by author pubkey
 * Business layer method for querying user's own contributions
 * 
 * @param pubkey - Author's public key
 * @returns Array of contribution events authored by this user
 */
export async function fetchContributionsByAuthor(pubkey: string): Promise<ContributionEvent[]> {
  try {
    logger.info('Fetching contributions by author', {
      service: 'ContributionService',
      method: 'fetchContributionsByAuthor',
      pubkey: pubkey.substring(0, 8) + '...',
    });

    // Query relays for contributions by this author
    // SOA Layer: Using GenericRelayService.queryEvents (not direct relay access)
    const filters = [
      {
        kinds: [30023],
        authors: [pubkey],
        '#t': ['nostr-for-nomads-contribution'],
      }
    ];

    const queryResult = await queryEvents(filters);

    if (!queryResult.events || queryResult.events.length === 0) {
      logger.info('No contributions found for author', {
        service: 'ContributionService',
        method: 'fetchContributionsByAuthor',
        pubkey: pubkey.substring(0, 8) + '...',
      });
      return [];
    }

    logger.info('Found contributions for author', {
      service: 'ContributionService',
      method: 'fetchContributionsByAuthor',
      pubkey: pubkey.substring(0, 8) + '...',
      count: queryResult.events.length,
    });

    // NIP-33 parameterized replaceable events - relays return latest version automatically
    // No client-side grouping needed
    const contributions: ContributionEvent[] = [];
    
    for (const event of queryResult.events) {
      const dTag = event.tags.find(t => t[0] === 'd')?.[1];
      if (!dTag) continue; // Skip events without dTag
      
      const title = event.tags.find(t => t[0] === 'title')?.[1] || '';
      const summary = event.tags.find(t => t[0] === 'summary')?.[1] || title;
      const category = event.tags.find(t => t[0] === 'category')?.[1] || '';
      const contributionType = event.tags.find(t => t[0] === 'contribution-type')?.[1] || '';
      const location = event.tags.find(t => t[0] === 'location')?.[1] || '';
      const region = event.tags.find(t => t[0] === 'region')?.[1] || '';
      const country = event.tags.find(t => t[0] === 'country')?.[1];
      const tags = event.tags
        .filter(t => t[0] === 't' && !t[1].startsWith('nostr-for-nomads-'))
        .map(t => t[1]);

      // Parse media from tags (simple URLs)
      const images = event.tags.filter(t => t[0] === 'image').map(t => t[1]);
      const videos = event.tags.filter(t => t[0] === 'video').map(t => t[1]);
      const audio = event.tags.filter(t => t[0] === 'audio').map(t => t[1]);

      contributions.push({
        id: event.id,
        dTag,
        pubkey: event.pubkey,
        title,
        summary,
        category,
        contributionType,
        location,
        region,
        country,
        tags,
        media: {
          images,
          videos,
          audio,
        },
        createdAt: event.created_at,
        publishedAt: event.created_at,
      });
    }

    // Sort by created_at descending (newest first)
    contributions.sort((a, b) => b.createdAt - a.createdAt);

    logger.info('Contributions by author fetched and parsed', {
      service: 'ContributionService',
      method: 'fetchContributionsByAuthor',
      count: contributions.length,
    });

    return contributions;
  } catch (error) {
    logger.error('Error fetching contributions by author', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'ContributionService',
      method: 'fetchContributionsByAuthor',
      pubkey: pubkey.substring(0, 8) + '...',
    });
    return [];
  }
}

/**
 * Delete a contribution by publishing NIP-09 deletion event
 * Business layer method for deleting user's own contribution
 * 
 * @param eventId - The event ID to delete
 * @param signer - Nostr signer for signing the deletion event
 * @param pubkey - Author's public key (for logging and validation)
 * @param title - Contribution title (for deletion reason)
 * @returns Result with success status and relay publishing info
 */
export async function deleteContribution(
  eventId: string,
  signer: NostrSigner,
  pubkey: string,
  title: string
): Promise<{ success: boolean; publishedRelays?: string[]; failedRelays?: string[]; error?: string }> {
  try {
    logger.info('Deleting contribution', {
      service: 'ContributionService',
      method: 'deleteContribution',
      eventId,
      pubkey: pubkey.substring(0, 8) + '...',
      title,
    });

    // SOA Layer: Use GenericEventService.createDeletionEvent (not manual event building)
    const deletionResult = createDeletionEvent(
      [eventId],
      pubkey,
      {
        reason: `Deleted contribution: ${title}`,
      }
    );

    if (!deletionResult.success || !deletionResult.event) {
      throw new Error(deletionResult.error || 'Failed to create deletion event');
    }

    // Sign the deletion event
    const signResult = await signEvent(deletionResult.event, signer);

    if (!signResult.success || !signResult.signedEvent) {
      throw new Error(signResult.error || 'Failed to sign deletion event');
    }

    logger.info('Deletion event created and signed', {
      service: 'ContributionService',
      method: 'deleteContribution',
      deletionEventId: signResult.signedEvent.id,
      targetEventId: eventId,
    });

    // Publish deletion event
    // SOA Layer: Use NostrEventService.publishEvent (not direct relay access)
    const publishResult = await nostrEventService.publishEvent(
      signResult.signedEvent as NostrEvent,
      signer
    );

    if (!publishResult.success) {
      logger.error('Failed to publish deletion event', new Error(publishResult.error), {
        service: 'ContributionService',
        method: 'deleteContribution',
        eventId,
      });
      return {
        success: false,
        error: publishResult.error,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    logger.info('Contribution deleted successfully', {
      service: 'ContributionService',
      method: 'deleteContribution',
      eventId,
      deletionEventId: signResult.signedEvent.id,
      publishedRelays: publishResult.publishedRelays.length,
    });

    return {
      success: true,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    logger.error('Error deleting contribution', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'ContributionService',
      method: 'deleteContribution',
      eventId,
      pubkey: pubkey.substring(0, 8) + '...',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error deleting contribution',
    };
  }
}

/**
 * Fetch a single contribution by dTag
 * Business layer method for retrieving specific contribution (for edit page)
 * 
 * @param dTag - The contribution's dTag identifier
 * @returns Contribution event or null if not found
 */
export async function fetchContributionById(dTag: string): Promise<ContributionEvent | null> {
  try {
    logger.info('Fetching contribution by dTag', {
      service: 'ContributionService',
      method: 'fetchContributionById',
      dTag,
    });

    // Query relays for the contribution event
    // SOA Layer: Using GenericRelayService.queryEvents (not direct relay access)
    const filters = [
      {
        kinds: [30023],
        '#d': [dTag],
        '#t': ['nostr-for-nomads-contribution'],
      }
    ];

    const queryResult = await queryEvents(filters);

    if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
      logger.warn('Contribution not found', {
        service: 'ContributionService',
        method: 'fetchContributionById',
        dTag,
      });
      return null;
    }

    // Get the most recent event (highest created_at) for NIP-33 parameterized replaceable events
    const latestEvent = queryResult.events.sort((a, b) => b.created_at - a.created_at)[0];

    // Extract data from event tags
    const title = latestEvent.tags.find(t => t[0] === 'title')?.[1] || '';
    const summary = latestEvent.tags.find(t => t[0] === 'summary')?.[1] || title;
    const category = latestEvent.tags.find(t => t[0] === 'category')?.[1] || '';
    const contributionType = latestEvent.tags.find(t => t[0] === 'contribution-type')?.[1] || '';
    const location = latestEvent.tags.find(t => t[0] === 'location')?.[1] || '';
    const region = latestEvent.tags.find(t => t[0] === 'region')?.[1] || '';
    const country = latestEvent.tags.find(t => t[0] === 'country')?.[1];
    const tags = latestEvent.tags
      .filter(t => t[0] === 't' && !t[1].startsWith('nostr-for-nomads-'))
      .map(t => t[1]);

    // Parse media from tags
    const images = latestEvent.tags.filter(t => t[0] === 'image').map(t => t[1]);
    const videos = latestEvent.tags.filter(t => t[0] === 'video').map(t => t[1]);
    const audio = latestEvent.tags.filter(t => t[0] === 'audio').map(t => t[1]);

    const contribution: ContributionEvent = {
      id: latestEvent.id,
      dTag,
      pubkey: latestEvent.pubkey,
      title,
      summary,
      category,
      contributionType,
      location,
      region,
      country,
      tags,
      media: {
        images,
        videos,
        audio,
      },
      createdAt: latestEvent.created_at,
      publishedAt: latestEvent.created_at,
    };

    logger.info('Contribution fetched successfully', {
      service: 'ContributionService',
      method: 'fetchContributionById',
      dTag,
      title: contribution.title,
    });

    return contribution;
  } catch (error) {
    logger.error('Error fetching contribution by dTag', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'ContributionService',
      method: 'fetchContributionById',
      dTag,
    });
    return null;
  }
}
