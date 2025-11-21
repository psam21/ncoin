import { logger } from '@/services/core/LoggingService';
import type { WorkData, WorkPublishingProgress } from '@/types/work';
import { validateWorkData } from './WorkValidationService';
import { nostrEventService } from '../nostr/NostrEventService';
import type { NostrSigner, NostrEvent } from '@/types/nostr';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';
import { 
  fetchPublicWorkOpportunities as fetchPublicWorkFromRelay, 
  type WorkEvent 
} from '@/services/generic/GenericWorkService';
import { getRelativeTime } from '@/utils/dateUtils';
import { queryEvents } from '@/services/generic/GenericRelayService';
import { createDeletionEvent, signEvent } from '@/services/generic/GenericEventService';
import { extractMedia } from '@/services/generic/GenericContributionService';

export interface CreateWorkResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  error?: string;
  [key: string]: unknown; // For generic wrapper compatibility
}

/**
 * Work opportunity explore item for listing view
 */
export interface WorkExploreItem {
  id: string;
  dTag: string;
  name: string;
  location: string;
  region: string;
  image: string;
  jobType: string;
  duration: string;
  payRate: number;
  currency: string;
  mediaCount: number;
  tags: string[];
  description: string;
  category: string;
  publishedAt: number;
  relativeTime: string;
  pubkey: string; // Author's pubkey for contact functionality
}

/**
 * Create a new work opportunity with file upload, event creation and publishing
 * Orchestrates: validation → upload → event creation → publishing
 * 
 * @param workData - Work opportunity data (attachments can be empty, will be populated from files)
 * @param attachmentFiles - File objects to upload (empty array if no files)
 * @param signer - Nostr signer for signing events and uploads
 * @param existingDTag - Optional dTag for updates (undefined for new opportunities)
 * @param onProgress - Optional callback for progress updates
 */
export async function createWork(
  workData: WorkData,
  attachmentFiles: File[],
  signer: NostrSigner,
  existingDTag?: string,
  onProgress?: (progress: WorkPublishingProgress) => void
): Promise<CreateWorkResult> {
  try {
    logger.info('Starting work opportunity creation', {
      service: 'WorkService',
      method: 'createWork',
      title: workData.title,
      isEdit: !!existingDTag,
      attachmentFilesCount: attachmentFiles.length,
    });

    // Step 1: Validate work data
    onProgress?.({
      step: 'validating',
      progress: 10,
      message: 'Validating work opportunity...',
      details: 'Checking required fields',
    });

    const validation = validateWorkData(workData);
    if (!validation.valid) {
      const errorMsg = Object.values(validation.errors).join(', ');
      logger.error('Work validation failed', new Error(errorMsg), {
        service: 'WorkService',
        method: 'createWork',
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
        service: 'WorkService',
        method: 'createWork',
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
          id: `${uploadedFile.hash}-${Date.now()}`,
          size: originalFile.size,
          mimeType,
        });
      }

      logger.info('Media uploaded successfully', {
        service: 'WorkService',
        method: 'createWork',
        uploadedCount: uploadResult.successCount,
        failedCount: uploadResult.failureCount,
      });
    }

    // Step 3: Use uploaded attachments only
    const allAttachments = uploadedAttachments.map(att => ({
      id: att.id,
      url: att.url,
      type: att.type,
      hash: att.hash,
      name: att.name,
      size: att.size,
      mimeType: att.mimeType,
    }));

    // Map to simplified format for event service
    const mappedAttachments = allAttachments
      .filter(att => att.url)
      .map(att => ({
        url: att.url!,
        type: att.type,
        hash: att.hash,
        name: att.name,
        size: att.size,
        mimeType: att.mimeType,
      }));

    // Step 4: Create Nostr event using work-specific method
    onProgress?.({
      step: 'publishing',
      progress: 70,
      message: 'Creating Nostr event...',
      details: 'Signing and creating event',
    });

    logger.info('Creating work event', {
      service: 'WorkService',
      method: 'createWork',
      title: workData.title,
      dTag: existingDTag,
    });

    const event = await nostrEventService.createWorkEvent(
      {
        title: workData.title,
        description: workData.description,
        category: workData.category,
        jobType: workData.jobType,
        duration: workData.duration,
        payRate: workData.payRate,
        currency: workData.currency,
        contact: workData.contact,
        language: workData.language || 'en',
        location: workData.location || '',
        region: workData.region,
        country: workData.country,
        tags: workData.tags,
        attachments: mappedAttachments,
      },
      signer,
      existingDTag
    );

    // Step 5: Publish to relays (optimistic - return on first success)
    onProgress?.({
      step: 'publishing',
      progress: 85,
      message: 'Publishing to relays...',
      details: 'Broadcasting event',
    });

    logger.info('Publishing event to relays with optimistic return', {
      service: 'WorkService',
      method: 'createWork',
      eventId: event.id,
      title: workData.title,
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
          service: 'WorkService',
          method: 'createWork',
          relay,
          status,
          eventId: event.id,
        });
      }
    );

    // Create a race condition: return as soon as we have first confirmation OR all complete
    const firstSuccessPromise = new Promise<CreateWorkResult>((resolve) => {
      let resolvedEarly = false;
      const publishedRelays: string[] = [];
      
      // Monitor progress and resolve early on first success
      const progressHandler = (relay: string, status: 'publishing' | 'success' | 'failed') => {
        if (status === 'success' && !resolvedEarly) {
          publishedRelays.push(relay);
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

    // Wait for either first success or full completion
    const publishResult = await Promise.race([
      firstSuccessPromise,
      publishPromise.then((result): CreateWorkResult => ({
        success: result.success,
        eventId: result.eventId,
        dTag,
        publishedRelays: result.publishedRelays,
        failedRelays: result.failedRelays,
      })),
    ]);

    // Background: Continue publishing to remaining relays
    publishPromise.then((finalResult) => {
      logger.info('Background relay publishing completed', {
        service: 'WorkService',
        method: 'createWork',
        eventId: event.id,
        finalPublishedCount: finalResult.publishedRelays.length,
        finalFailedCount: finalResult.failedRelays.length,
      });
    }).catch((err) => {
      logger.warn('Background relay publishing encountered errors', {
        service: 'WorkService',
        method: 'createWork',
        eventId: event.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    });

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
      message: 'Work opportunity published!',
      details: `Successfully published to ${publishResult.publishedRelays?.length || 1} relays`,
    });

    logger.info('Work opportunity created successfully', {
      service: 'WorkService',
      method: 'createWork',
      eventId: event.id,
      dTag,
      title: workData.title,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to create work opportunity', error instanceof Error ? error : new Error(errorMessage), {
      service: 'WorkService',
      method: 'createWork',
      title: workData.title,
      error: errorMessage,
    });
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Transform work event to work explore item
 */
function mapToExploreItem(event: WorkEvent): WorkExploreItem {
  const totalMedia = 
    event.media.images.length +
    event.media.audio.length +
    event.media.videos.length;
  
  const image = event.media.images[0]?.url || 
                event.media.videos[0]?.url || 
                'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=400&h=300&fit=crop';
  
  return {
    id: event.id,
    dTag: event.dTag,
    name: event.title,
    location: event.region || event.location || 'Remote',
    region: event.region || 'Global',
    image,
    jobType: event.jobType,
    duration: event.duration,
    payRate: event.payRate,
    currency: event.currency,
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
 * Fetch public work opportunities for explore/listing view
 * Business layer method that orchestrates fetching and data transformation
 * 
 * @param limit - Maximum number of work opportunities to fetch
 * @param until - Optional timestamp for pagination (fetch opportunities before this time)
 * @returns Array of work explore items ready for display
 */
export async function fetchPublicWorkOpportunities(
  limit = 8,
  until?: number
): Promise<WorkExploreItem[]> {
  try {
    logger.info('Fetching public work opportunities', {
      service: 'WorkService',
      method: 'fetchPublicWorkOpportunities',
      limit,
      until,
      hasPagination: !!until,
    });

    // Fetch from generic service
    const events = await fetchPublicWorkFromRelay(limit, until);
    
    // Transform to explore items (business logic)
    const items = events.map(mapToExploreItem);
    
    logger.info('Public work opportunities fetched and transformed', {
      service: 'WorkService',
      method: 'fetchPublicWorkOpportunities',
      itemCount: items.length,
    });

    return items;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch work opportunities', error instanceof Error ? error : new Error(errorMessage), {
      service: 'WorkService',
      method: 'fetchPublicWorkOpportunities',
      error: errorMessage,
    });
    return [];
  }
}

/**
 * Fetch work opportunities by author
 * Business layer method for querying user's own work postings
 * 
 * @param pubkey - Author's public key
 * @returns Array of work events authored by this user
 */
export async function fetchWorkByAuthor(pubkey: string): Promise<WorkEvent[]> {
  try {
    logger.info('Fetching work opportunities by author', {
      service: 'WorkService',
      method: 'fetchWorkByAuthor',
      pubkey: pubkey.substring(0, 8) + '...',
    });

    // Query relays for work opportunities by this author
    const filters = [
      {
        kinds: [30023],
        authors: [pubkey],
        '#t': ['nostr-for-nomads-work'],
      }
    ];

    const queryResult = await queryEvents(filters);

    if (!queryResult.events || queryResult.events.length === 0) {
      logger.info('No work opportunities found for author', {
        service: 'WorkService',
        method: 'fetchWorkByAuthor',
        pubkey: pubkey.substring(0, 8) + '...',
      });
      return [];
    }

    logger.info('Found work opportunities for author', {
      service: 'WorkService',
      method: 'fetchWorkByAuthor',
      pubkey: pubkey.substring(0, 8) + '...',
      count: queryResult.events.length,
    });

    // NIP-33 parameterized replaceable events - deduplicate by dTag, keeping newest
    const eventsByDTag = new Map<string, NostrEvent>();
    
    for (const event of queryResult.events) {
      const dTag = event.tags.find(t => t[0] === 'd')?.[1];
      if (!dTag) continue;
      
      const existing = eventsByDTag.get(dTag);
      if (!existing || event.created_at > existing.created_at) {
        eventsByDTag.set(dTag, event);
      }
    }

    logger.info('Deduplicated work opportunities by dTag', {
      service: 'WorkService',
      method: 'fetchWorkByAuthor',
      originalCount: queryResult.events.length,
      deduplicatedCount: eventsByDTag.size,
    });

    const workOpportunities: WorkEvent[] = [];
    
    for (const event of eventsByDTag.values()) {
      const dTag = event.tags.find(t => t[0] === 'd')?.[1];
      if (!dTag) continue;
      
      const title = event.tags.find(t => t[0] === 'title')?.[1] || '';
      const summary = event.tags.find(t => t[0] === 'summary')?.[1] || title;
      
      // Parse description from event.content
      let description = '';
      try {
        const nip23Content = JSON.parse(event.content);
        description = nip23Content.content || event.content || summary;
      } catch {
        description = event.content || summary;
      }
      
      const category = event.tags.find(t => t[0] === 'category')?.[1] || '';
      const jobType = event.tags.find(t => t[0] === 'job-type')?.[1] || '';
      const duration = event.tags.find(t => t[0] === 'duration')?.[1] || '';
      const payRateStr = event.tags.find(t => t[0] === 'pay-rate')?.[1] || '0';
      const payRate = parseFloat(payRateStr);
      const currency = event.tags.find(t => t[0] === 'currency')?.[1] || '';
      const contact = event.tags.find(t => t[0] === 'contact')?.[1];
      const language = event.tags.find(t => t[0] === 'language')?.[1] || 'en';
      const location = event.tags.find(t => t[0] === 'location')?.[1] || '';
      const region = event.tags.find(t => t[0] === 'region')?.[1] || '';
      const country = event.tags.find(t => t[0] === 'country')?.[1];
      const tags = event.tags
        .filter(t => t[0] === 't' && !t[1].startsWith('nostr-for-nomads-'))
        .map(t => t[1]);

      const media = extractMedia(event.tags);

      workOpportunities.push({
        id: event.id,
        dTag,
        pubkey: event.pubkey,
        title,
        summary,
        description,
        category,
        jobType,
        duration,
        payRate,
        currency,
        contact,
        language,
        location,
        region,
        country,
        tags,
        media,
        createdAt: event.created_at,
        publishedAt: event.created_at,
      });
    }

    // Sort by created_at DESC (newest first)
    workOpportunities.sort((a, b) => b.createdAt - a.createdAt);

    logger.info('Work opportunities by author parsed successfully', {
      service: 'WorkService',
      method: 'fetchWorkByAuthor',
      parsedCount: workOpportunities.length,
    });

    return workOpportunities;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch work by author', error instanceof Error ? error : new Error(errorMessage), {
      service: 'WorkService',
      method: 'fetchWorkByAuthor',
      pubkey: pubkey.substring(0, 8) + '...',
      error: errorMessage,
    });
    return [];
  }
}

/**
 * Fetch single work opportunity by dTag
 * 
 * @param dTag - The d tag (unique identifier) of the work opportunity
 * @returns Work event or null if not found
 */
export async function fetchWorkById(dTag: string): Promise<WorkEvent | null> {
  try {
    logger.info('Fetching work opportunity by dTag', {
      service: 'WorkService',
      method: 'fetchWorkById',
      dTag,
    });

    const filters = [
      {
        kinds: [30023],
        '#d': [dTag],
        '#t': ['nostr-for-nomads-work'],
      }
    ];

    const queryResult = await queryEvents(filters);

    if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
      logger.warn('Work opportunity not found', {
        service: 'WorkService',
        method: 'fetchWorkById',
        dTag,
      });
      return null;
    }

    // Get the most recent event (highest created_at)
    const latestEvent = queryResult.events.sort((a, b) => b.created_at - a.created_at)[0];

    const title = latestEvent.tags.find(t => t[0] === 'title')?.[1] || '';
    const summary = latestEvent.tags.find(t => t[0] === 'summary')?.[1] || title;
    
    // Parse description from event.content
    let description = '';
    try {
      const nip23Content = JSON.parse(latestEvent.content);
      description = nip23Content.content || latestEvent.content || summary;
    } catch {
      description = latestEvent.content || summary;
    }
    
    const category = latestEvent.tags.find(t => t[0] === 'category')?.[1] || '';
    const jobType = latestEvent.tags.find(t => t[0] === 'job-type')?.[1] || '';
    const duration = latestEvent.tags.find(t => t[0] === 'duration')?.[1] || '';
    const payRateStr = latestEvent.tags.find(t => t[0] === 'pay-rate')?.[1] || '0';
    const payRate = parseFloat(payRateStr);
    const currency = latestEvent.tags.find(t => t[0] === 'currency')?.[1] || '';
    const contact = latestEvent.tags.find(t => t[0] === 'contact')?.[1];
    const language = latestEvent.tags.find(t => t[0] === 'language')?.[1] || 'en';
    const location = latestEvent.tags.find(t => t[0] === 'location')?.[1] || '';
    const region = latestEvent.tags.find(t => t[0] === 'region')?.[1] || '';
    const country = latestEvent.tags.find(t => t[0] === 'country')?.[1];
    const tags = latestEvent.tags
      .filter(t => t[0] === 't' && !t[1].startsWith('nostr-for-nomads-'))
      .map(t => t[1]);

    const media = extractMedia(latestEvent.tags);

    const workOpportunity: WorkEvent = {
      id: latestEvent.id,
      dTag,
      pubkey: latestEvent.pubkey,
      title,
      summary,
      description,
      category,
      jobType,
      duration,
      payRate,
      currency,
      contact,
      language,
      location,
      region,
      country,
      tags,
      media,
      createdAt: latestEvent.created_at,
      publishedAt: latestEvent.created_at,
    };

    logger.info('Work opportunity fetched successfully', {
      service: 'WorkService',
      method: 'fetchWorkById',
      dTag,
      title,
    });

    return workOpportunity;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch work by ID', error instanceof Error ? error : new Error(errorMessage), {
      service: 'WorkService',
      method: 'fetchWorkById',
      dTag,
      error: errorMessage,
    });
    return null;
  }
}

/**
 * Delete a work opportunity
 * 
 * @param eventId - Event ID to delete
 * @param signer - Nostr signer for signing the deletion event
 * @param pubkey - Author's public key (for logging and validation)
 * @param title - Work title (for deletion reason)
 * @returns Result with success status and relay publishing info
 */
export async function deleteWork(
  eventId: string,
  signer: NostrSigner,
  pubkey: string,
  title: string
): Promise<{ success: boolean; publishedRelays?: string[]; failedRelays?: string[]; error?: string }> {
  try {
    logger.info('Deleting work opportunity', {
      service: 'WorkService',
      method: 'deleteWork',
      eventId,
      pubkey: pubkey.substring(0, 8) + '...',
      title,
    });

    const deletionResult = createDeletionEvent(
      [eventId],
      pubkey,
      {
        reason: `Deleted work opportunity: ${title}`,
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
      service: 'WorkService',
      method: 'deleteWork',
      deletionEventId: signResult.signedEvent.id,
      targetEventId: eventId,
    });

    // Publish deletion event
    const publishResult = await nostrEventService.publishEvent(
      signResult.signedEvent as NostrEvent,
      signer
    );

    if (!publishResult.success) {
      logger.error('Failed to publish deletion event', new Error(publishResult.error), {
        service: 'WorkService',
        method: 'deleteWork',
        eventId,
      });
      return {
        success: false,
        error: publishResult.error,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    logger.info('Work opportunity deleted successfully', {
      service: 'WorkService',
      method: 'deleteWork',
      eventId,
      publishedRelays: publishResult.publishedRelays.length,
    });

    return {
      success: true,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to delete work opportunity', error instanceof Error ? error : new Error(errorMessage), {
      service: 'WorkService',
      method: 'deleteWork',
      eventId,
      error: errorMessage,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export const WorkService = {
  createWork,
  fetchPublicWorkOpportunities,
  fetchWorkByAuthor,
  fetchWorkById,
  deleteWork,
};

