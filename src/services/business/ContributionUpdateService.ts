import { logger } from '@/services/core/LoggingService';
import type { ContributionData, ContributionPublishingProgress } from '@/types/contributions';
import type { NostrSigner } from '@/types/nostr';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';
import { nostrEventService } from '../nostr/NostrEventService';
import { fetchContributionById } from './ContributionService';

export interface UpdateContributionResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  error?: string;
  [key: string]: unknown; // For generic wrapper compatibility
}

/**
 * Update an existing contribution with attachments
 * Follows reference pattern: fetch original → upload new → merge with selective ops → publish
 * 
 * @param contributionId - The d-tag ID of the contribution to update
 * @param updatedData - Partial contribution data with fields to update
 * @param attachmentFiles - New File objects to upload (NOT existing attachments)
 * @param signer - Nostr signer for signing events
 * @param onProgress - Optional callback for progress updates
 * @param selectiveOps - Optional: Explicitly specify which attachments to keep/remove
 */
export async function updateContributionWithAttachments(
  contributionId: string,
  updatedData: Partial<ContributionData>,
  attachmentFiles: File[],
  signer: NostrSigner,
  onProgress?: (progress: ContributionPublishingProgress) => void,
  selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
): Promise<UpdateContributionResult> {
  try {
    onProgress?.({
      step: 'validating',
      progress: 5,
      message: 'Starting update...',
      details: 'Validating contribution',
    });

    logger.info('Starting contribution update with attachments', {
      service: 'ContributionUpdateService',
      method: 'updateContributionWithAttachments',
      contributionId,
      newAttachmentCount: attachmentFiles.length,
      hasSelectiveOps: !!selectiveOps,
      selectiveOps: selectiveOps ? {
        removedCount: selectiveOps.removedAttachments.length,
        keptCount: selectiveOps.keptAttachments.length,
      } : null,
    });

    // Step 1: Fetch the original contribution
    const originalContribution = await fetchContributionById(contributionId);
    if (!originalContribution) {
      return {
        success: false,
        error: `Original contribution not found: ${contributionId}`,
      };
    }

    logger.info('Original contribution state before update', {
      service: 'ContributionUpdateService',
      method: 'updateContributionWithAttachments',
      contributionId,
      originalState: {
        title: originalContribution.title,
        description: originalContribution.description,
        mediaCount: (originalContribution.media.images.length + originalContribution.media.videos.length + originalContribution.media.audio.length),
      },
    });

    // Step 2: Upload new attachment files (if any)
    let newAttachments: Array<{
      url: string;
      type: 'image' | 'video' | 'audio';
      hash?: string;
      name: string;
      size?: number;
      mimeType?: string;
    }> = [];

    if (attachmentFiles.length > 0) {
      onProgress?.({
        step: 'uploading',
        progress: 10,
        message: 'Starting media upload...',
        details: `Uploading ${attachmentFiles.length} file(s)`,
      });

      logger.info('Uploading new attachments', {
        service: 'ContributionUpdateService',
        method: 'updateContributionWithAttachments',
        fileCount: attachmentFiles.length,
      });

      const uploadResult = await uploadSequentialWithConsent(
        attachmentFiles,
        signer,
        (progress) => {
          // Map upload progress to contribution publishing progress (10% to 70%)
          const progressPercent = 10 + (progress.overallProgress * 60);
          onProgress?.({
            step: 'uploading',
            progress: progressPercent,
            message: 'Uploading attachments...',
            details: `File ${progress.currentFileIndex + 1} of ${progress.totalFiles}`,
          });

          logger.info('Upload progress', {
            service: 'ContributionUpdateService',
            method: 'updateContributionWithAttachments',
            ...progress,
          });
        }
      );

      if (!uploadResult.success && !uploadResult.partialSuccess) {
        return {
          success: false,
          error: `Failed to upload attachments: ${uploadResult.failedFiles.map(f => f.error).join(', ')}`,
        };
      }

      // Map uploaded files to attachment format
      newAttachments = uploadResult.uploadedFiles.map((uploaded) => {
        const file = attachmentFiles.find(f => f.name === uploaded.fileId);
        const fileType = uploaded.fileType || '';
        
        let attachmentType: 'image' | 'video' | 'audio' = 'image';
        if (fileType.startsWith('video/')) attachmentType = 'video';
        else if (fileType.startsWith('audio/')) attachmentType = 'audio';

        return {
          url: uploaded.url,
          type: attachmentType,
          hash: uploaded.hash,
          name: file?.name || uploaded.fileId,
          size: uploaded.fileSize,
          mimeType: uploaded.fileType,
        };
      });

      logger.info('New attachments uploaded', {
        service: 'ContributionUpdateService',
        method: 'updateContributionWithAttachments',
        uploadedCount: newAttachments.length,
        failedCount: uploadResult.failedFiles.length,
      });
    }

    // Step 3: Merge attachments using selective operations
    let allAttachments: Array<{
      url: string;
      type: 'image' | 'video' | 'audio';
      hash?: string;
      name: string;
      size?: number;
      mimeType?: string;
    }> = [];

    // Convert existing media to attachment format
    const existingAttachments = [
      ...originalContribution.media.images.map(m => ({
        id: m.hash || m.url,
        url: m.url,
        type: 'image' as const,
        hash: m.hash,
        name: m.url.split('/').pop() || 'image',
        size: m.size,
        mimeType: m.mimeType,
      })),
      ...originalContribution.media.videos.map(m => ({
        id: m.hash || m.url,
        url: m.url,
        type: 'video' as const,
        hash: m.hash,
        name: m.url.split('/').pop() || 'video',
        size: m.size,
        mimeType: m.mimeType,
      })),
      ...originalContribution.media.audio.map(m => ({
        id: m.hash || m.url,
        url: m.url,
        type: 'audio' as const,
        hash: m.hash,
        name: m.url.split('/').pop() || 'audio',
        size: m.size,
        mimeType: m.mimeType,
      })),
    ];

    if (selectiveOps) {
      // Selective mode: Keep only specified attachments + add new ones
      const keptUrlSet = new Set<string>();
      selectiveOps.keptAttachments.forEach(keptId => {
        const found = existingAttachments.find(att => att.id === keptId);
        if (found?.url) {
          keptUrlSet.add(found.url);
        }
      });
      
      // Filter by URL (stable identifier across re-fetches)
      const keptAttachments = existingAttachments.filter(att => 
        keptUrlSet.has(att.url)
      );
      allAttachments = [...keptAttachments, ...newAttachments];

      logger.info('Selective attachment merge', {
        service: 'ContributionUpdateService',
        method: 'updateContributionWithAttachments',
        originalCount: existingAttachments.length,
        keptCount: keptAttachments.length,
        removedCount: selectiveOps.removedAttachments.length,
        newCount: newAttachments.length,
        finalCount: allAttachments.length,
      });
    } else {
      // Legacy mode: Keep all existing + add new ones
      allAttachments = newAttachments.length > 0
        ? [...existingAttachments, ...newAttachments]
        : existingAttachments;

      logger.info('Legacy attachment merge (keep all + new)', {
        service: 'ContributionUpdateService',
        method: 'updateContributionWithAttachments',
        existingCount: existingAttachments.length,
        newCount: newAttachments.length,
        finalCount: allAttachments.length,
      });
    }

    // Step 4: Prepare merged data
    const mergedData = {
      title: updatedData.title !== undefined ? updatedData.title : originalContribution.title,
      description: updatedData.description !== undefined ? updatedData.description : originalContribution.description,
      category: updatedData.category !== undefined ? updatedData.category : originalContribution.category,
      contributionType: updatedData.contributionType !== undefined ? updatedData.contributionType : originalContribution.contributionType,
      language: updatedData.language !== undefined ? updatedData.language : originalContribution.language,
      location: updatedData.location !== undefined ? updatedData.location : originalContribution.location,
      region: updatedData.region !== undefined ? updatedData.region : originalContribution.region,
      country: updatedData.country !== undefined ? updatedData.country : (originalContribution.country || ''),
      tags: updatedData.tags !== undefined ? updatedData.tags : originalContribution.tags,
      attachments: allAttachments,
    };

    // Step 5: Check for changes (avoid unnecessary updates)
    const hasContentChanges = 
      (updatedData.title !== undefined && updatedData.title !== originalContribution.title) ||
      (updatedData.description !== undefined && updatedData.description !== originalContribution.description) ||
      (updatedData.category !== undefined && updatedData.category !== originalContribution.category) ||
      (updatedData.contributionType !== undefined && updatedData.contributionType !== originalContribution.contributionType) ||
      (updatedData.language !== undefined && updatedData.language !== originalContribution.language) ||
      (updatedData.location !== undefined && updatedData.location !== originalContribution.location) ||
      (updatedData.region !== undefined && updatedData.region !== originalContribution.region) ||
      (updatedData.country !== undefined && updatedData.country !== originalContribution.country) ||
      (updatedData.tags !== undefined && JSON.stringify(updatedData.tags) !== JSON.stringify(originalContribution.tags));

    const hasAttachmentChanges = newAttachments.length > 0 || (selectiveOps && selectiveOps.removedAttachments.length > 0);

    if (!hasContentChanges && !hasAttachmentChanges) {
      logger.info('No changes detected, skipping update', {
        service: 'ContributionUpdateService',
        method: 'updateContributionWithAttachments',
        contributionId,
        reason: 'No content or attachment changes detected',
      });

      return {
        success: true,
        dTag: originalContribution.dTag,
        eventId: originalContribution.id,
      };
    }

    logger.info('Changes detected, proceeding with update', {
      service: 'ContributionUpdateService',
      method: 'updateContributionWithAttachments',
      contributionId,
      hasContentChanges,
      hasAttachmentChanges,
    });

    // Step 6: Create NIP-33 replacement event (same dTag)
    onProgress?.({
      step: 'publishing',
      progress: 75,
      message: 'Creating event...',
      details: 'Preparing NIP-33 replacement event',
    });

    logger.info('Creating replacement event', {
      service: 'ContributionUpdateService',
      method: 'updateContributionWithAttachments',
      dTag: originalContribution.dTag,
      title: mergedData.title,
      attachmentCount: allAttachments.length,
    });

    const event = await nostrEventService.createContributionEvent(
      mergedData,
      signer,
      originalContribution.dTag // Same dTag for NIP-33 replacement
    );

    // Step 7: Publish to relays
    onProgress?.({
      step: 'publishing',
      progress: 85,
      message: 'Publishing to relays...',
      details: 'Broadcasting replacement event',
    });

    logger.info('Publishing replacement event to relays', {
      service: 'ContributionUpdateService',
      method: 'updateContributionWithAttachments',
      eventId: event.id,
      dTag: originalContribution.dTag,
    });

    const publishResult = await nostrEventService.publishEvent(
      event,
      signer
    );

    if (!publishResult.success) {
      logger.error('Failed to publish replacement event', new Error(publishResult.error), {
        service: 'ContributionUpdateService',
        method: 'updateContributionWithAttachments',
        eventId: event.id,
      });
      return {
        success: false,
        error: `Failed to publish to any relay: ${publishResult.error}`,
        eventId: event.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    logger.info('Contribution updated successfully', {
      service: 'ContributionUpdateService',
      method: 'updateContributionWithAttachments',
      eventId: event.id,
      dTag: originalContribution.dTag,
      title: mergedData.title,
      publishedRelays: publishResult.publishedRelays.length,
      mediaCount: allAttachments.length,
    });

    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Update complete!',
      details: `Published to ${publishResult.publishedRelays.length} relays`,
    });

    return {
      success: true,
      eventId: event.id,
      dTag: originalContribution.dTag,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };

  } catch (error) {
    logger.error('Failed to update contribution', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'ContributionUpdateService',
      method: 'updateContributionWithAttachments',
      contributionId,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating contribution',
    };
  }
}
