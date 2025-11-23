'use client';

import { useState, useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useContentPublishing } from './useContentPublishing';
import { createMeetup } from '@/services/business/MeetService';
import type {
  MeetupData,
  MeetupPublishingResult,
  MeetupPublishingProgress,
  MeetupPublishingState,
} from '@/types/meetup';

/**
 * Hook for publishing meetup calendar events
 * Manages publishing state and coordinates with meet service
 * 
 * Uses the generic content publishing wrapper for:
 * - Signer validation
 * - Consent dialog for image upload
 * - Progress tracking
 * - Error handling
 * - Logging
 */
export function useMeetPublishing() {
  const { isAvailable, getSigner } = useNostrSigner();
  
  // Publishing state
  const [state, setState] = useState<MeetupPublishingState>({
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
    setProgress: (progress: MeetupPublishingProgress | null) => {
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
    setResult: (result: MeetupPublishingResult | null) => {
      setState(prev => ({
        ...prev,
        result,
        error: result && !result.success ? result.error || null : null,
      }));
    },
  };

  // Initialize generic publishing wrapper
  const { publishWithWrapper, consentDialog } = useContentPublishing<
    MeetupData,
    MeetupPublishingResult,
    MeetupPublishingProgress
  >({
    serviceName: 'MeetService',
    methodName: 'createMeetup',
    isAvailable,
    getSigner,
    stateSetters,
  });

  /**
   * Publish a meetup
   */
  const publishMeetup = useCallback(
    async (
      data: MeetupData,
      attachmentFiles: File[],
      existingDTag?: string
    ): Promise<MeetupPublishingResult> => {
      // Reset state
      setState({
        isPublishing: true,
        uploadProgress: 0,
        currentStep: 'validating',
        error: null,
        result: null,
      });

      // Use wrapper function to adapt parameter order
      // Generic wrapper expects: (data, files, signer, onProgress)
      // But createMeetup expects: (data, attachmentFiles, signer, existingDTag, onProgress)
      const result = await publishWithWrapper(
        async (meetupData, _files, signer, onProgress) => {
          const serviceResult = await createMeetup(
            meetupData,
            attachmentFiles,
            signer,
            existingDTag,
            onProgress
          );

          return serviceResult;
        },
        data,
        attachmentFiles
      );

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
    // State
    isPublishing: state.isPublishing,
    uploadProgress: state.uploadProgress,
    currentStep: state.currentStep,
    error: state.error,
    result: state.result,
    
    // Actions
    publishMeetup,
    reset: resetPublishing,
    
    // Consent dialog (from generic wrapper)
    consentDialog,
  };
}
