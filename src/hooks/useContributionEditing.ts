import { 
  updateContributionWithAttachments, 
  UpdateContributionResult
} from '@/services/business/ContributionUpdateService';
import type { ContributionData, ContributionPublishingProgress } from '@/types/contributions';
import { useContentEditing, type SimpleUpdateFunction } from './useContentEditing';

/**
 * Hook for editing contributions
 * 
 * Uses generic useContentEditing hook to handle common editing patterns:
 * - Signer validation
 * - State management (isUpdating, updateError, updateProgress)
 * - Progress tracking
 * - Error handling
 * - Logging
 */
export function useContributionEditing() {
  // Wrap the service function to match SimpleUpdateFunction signature
  const updateFn: SimpleUpdateFunction<ContributionData, UpdateContributionResult, ContributionPublishingProgress> = async (
    contentId,
    updatedData,
    attachmentFiles,
    signer,
    onProgress,
    selectiveOps
  ) => {
    return await updateContributionWithAttachments(
      contentId,
      updatedData,
      attachmentFiles,
      signer,
      onProgress,
      selectiveOps
    );
  };

  const {
    isUpdating,
    updateError,
    updateProgress,
    updateContent,
    clearUpdateError,
  } = useContentEditing<ContributionData, UpdateContributionResult, ContributionPublishingProgress>(
    'useContributionEditing',
    updateFn,
    false // Contribution update doesn't require pubkey parameter
  );

  return {
    isUpdating,
    updateError,
    updateProgress,
    updateContributionData: updateContent,
    clearUpdateError,
  };
}
