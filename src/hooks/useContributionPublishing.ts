'use client';

import { useState, useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useContentPublishing } from './useContentPublishing';
import { createContribution } from '@/services/business/ContributionService';
import type {
  ContributionData,
  ContributionPublishingResult,
  ContributionPublishingProgress,
  ContributionPublishingState,
} from '@/types/contributions';

/**
 * Hook for publishing nomad contributions
 * Manages publishing state and coordinates with contribution service
 * 
 * Uses the generic content publishing wrapper for:
 * - Signer validation
 * - Consent dialog for file uploads
 * - Progress tracking
 * - Error handling
 * - Logging
 */
export function useContributionPublishing() {
  const { isAvailable, getSigner } = useNostrSigner();
  
  // Publishing state
  const [state, setState] = useState<ContributionPublishingState>({
    isPublishing: false,
    uploadProgress: 0,
    currentStep: 'idle',
    error: null,
    result: null,
  });

  // State setters for the generic wrapper
  const stateSetters = {
    setPublishing: (isPublishing: boolean) => {
      setState(prev => ({ ...prev, isPublishing }));
    },
    setProgress: (progress: ContributionPublishingProgress | null) => {
      if (progress) {
        setState(prev => ({
          ...prev,
          uploadProgress: progress.progress,
          currentStep: progress.step,
        }));
      } else {
        setState(prev => ({
          ...prev,
          uploadProgress: 0,
          currentStep: 'idle',
        }));
      }
    },
    setResult: (result: ContributionPublishingResult | null) => {
      setState(prev => ({
        ...prev,
        result,
        error: result && !result.success ? result.error || null : null,
      }));
    },
  };

  // Initialize generic publishing wrapper
  const { publishWithWrapper, consentDialog } = useContentPublishing<
    ContributionData,
    ContributionPublishingResult,
    ContributionPublishingProgress
  >({
    serviceName: 'ContributionService',
    methodName: 'createContribution',
    isAvailable,
    getSigner,
    stateSetters,
  });

  /**
   * Publish a contribution
   */
  const publishContribution = useCallback(
    async (
      data: ContributionData,
      attachmentFiles: File[],
      existingDTag?: string
    ): Promise<ContributionPublishingResult> => {
      console.log('[useContributionPublishing] publishContribution called', {
        attachmentCount: attachmentFiles.length,
        hasExistingDTag: !!existingDTag,
      });

      // Reset state
      setState({
        isPublishing: true,
        uploadProgress: 0,
        currentStep: 'validating',
        error: null,
        result: null,
      });

      console.log('[useContributionPublishing] About to call publishWithWrapper');

      // Use wrapper function to adapt parameter order
      // Generic wrapper expects: (data, files, signer, onProgress)
      // But createContribution expects: (data, files, signer, existingDTag, onProgress)
      const result = await publishWithWrapper(
        async (contributionData, files, signer, onProgress) => {
          console.log('[useContributionPublishing] Inside publishWithWrapper callback', {
            filesCount: files.length,
          });

          const serviceResult = await createContribution(
            contributionData,
            files,
            signer,
            existingDTag,
            onProgress
          );

          console.log('[useContributionPublishing] createContribution completed', {
            success: serviceResult.success,
          });

          return serviceResult;
        },
        data,
        attachmentFiles
      );

      console.log('[useContributionPublishing] publishWithWrapper completed', {
        success: result.success,
      });

      return result;
    },
    [publishWithWrapper]
  );

  /**
   * Reset publishing state
   */
  const resetPublishing = useCallback(() => {
    setState({
      isPublishing: false,
      uploadProgress: 0,
      currentStep: 'idle',
      error: null,
      result: null,
    });
  }, []);

  return {
    ...state,
    publishContribution,
    resetPublishing,
    consentDialog, // Expose consent dialog for UI rendering
  };
}
