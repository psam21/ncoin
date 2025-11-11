import { logger } from '@/services/core/LoggingService';
import type { ContributionData, ContributionPublishingProgress } from '@/types/contributions';
import { validateContributionData } from '@/types/contributions';
import { nostrEventService } from '../nostr/NostrEventService';
import type { NostrSigner } from '@/types/nostr';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';
import { fetchPublicContributions as fetchPublicContributionsFromRelay, type ContributionEvent } from '@/services/generic/GenericContributionService';

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
      }));

    // Step 4: Map nomad contribution data to heritage event format
    // This allows us to reuse NostrEventService.createHeritageEvent()
    const heritageData = {
      title: contributionData.title,
      category: contributionData.category,
      heritageType: contributionData.contributionType, // Map contributionType → heritageType
      timePeriod: 'contemporary', // Fixed value for nomad contributions
      sourceType: 'first-hand', // Fixed value (all nomad contributions are first-hand)
      region: contributionData.region,
      country: contributionData.country,
      contributorRole: 'contributor', // Fixed value
      description: contributionData.description,
      language: contributionData.language || 'en',
      community: contributionData.location || '', // Map location → community
      knowledgeKeeperContact: '', // Not used for nomad contributions
      tags: contributionData.tags,
      attachments: mappedAttachments,
    };

    // Step 5: Create Nostr event using event service
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

    const event = await nostrEventService.createHeritageEvent(
      heritageData,
      signer,
      existingDTag
    );

    // Step 6: Publish to relays
    onProgress?.({
      step: 'publishing',
      progress: 85,
      message: 'Publishing to relays...',
      details: 'Broadcasting event',
    });

    logger.info('Publishing event to relays', {
      service: 'ContributionService',
      method: 'createContribution',
      eventId: event.id,
      title: contributionData.title,
    });

    const publishResult = await nostrEventService.publishEvent(
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

    if (!publishResult.success) {
      return {
        success: false,
        error: `Failed to publish to any relay: ${publishResult.error}`,
        eventId: event.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    // Step 7: Extract dTag from event
    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Contribution published!',
      details: `Successfully published to ${publishResult.publishedRelays.length} relays`,
    });

    const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
    if (!dTag) {
      throw new Error('Created event missing required d tag');
    }

    logger.info('Contribution created successfully', {
      service: 'ContributionService',
      method: 'createContribution',
      eventId: event.id,
      dTag,
      title: contributionData.title,
      publishedRelays: publishResult.publishedRelays.length,
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
 * Calculate relative time string from timestamp
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
  if (diff < week) return `${Math.floor(diff / day)} days ago`;
  if (diff < month) return `${Math.floor(diff / week)} weeks ago`;
  if (diff < year) return `${Math.floor(diff / month)} months ago`;
  return `${Math.floor(diff / year)} years ago`;
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
