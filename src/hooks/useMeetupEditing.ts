'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { updateMeetup } from '@/services/business/MeetService';
import { useNostrSigner } from './useNostrSigner';
import type { MeetupData, MeetupPublishingResult, MeetupPublishingProgress } from '@/types/meetup';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

/**
 * Meetup editing state
 */
interface MeetupEditingState {
  isUpdating: boolean;
  updateProgress: MeetupPublishingProgress | null;
  updateError: string | null;
  updateResult: MeetupPublishingResult | null;
}

/**
 * Hook for editing existing meetups
 * 
 * This hook provides:
 * - State management for update operations
 * - Progress tracking during updates
 * - Simplified image replacement (single image)
 * - Auto-signer integration
 * 
 * @returns Object with updateMeetupContent function and state
 */
export function useMeetupEditing() {
  const { getSigner } = useNostrSigner();
  
  const [state, setState] = useState<MeetupEditingState>({
    isUpdating: false,
    updateProgress: null,
    updateError: null,
    updateResult: null,
  });

  /**
   * Update meetup content
   * 
   * @param dTag - Existing meetup dTag
   * @param updatedData - Updated meetup data
   * @param attachmentFiles - Array of new media files to upload
   */
  const updateMeetupContent = useCallback(async (
    dTag: string,
    updatedData: MeetupData,
    attachmentFiles: File[] = []
  ): Promise<MeetupPublishingResult> => {
    let signer;
    try {
      signer = await getSigner();
    } catch (error) {
      const errorMsg = 'No signer available. Please sign in first.';
      logger.error('Update meetup failed: no signer', error instanceof Error ? error : new Error(errorMsg), {
        service: 'useMeetupEditing',
        method: 'updateMeetupContent',
      });
      
      setState({
        isUpdating: false,
        updateProgress: null,
        updateError: errorMsg,
        updateResult: null,
      });
      
      return { success: false, error: errorMsg };
    }

    try {
      logger.info('Starting meetup update', {
        service: 'useMeetupEditing',
        method: 'updateMeetupContent',
        dTag,
        attachmentCount: attachmentFiles.length,
      });

      setState({
        isUpdating: true,
        updateProgress: null,
        updateError: null,
        updateResult: null,
      });

      const result = await updateMeetup(
        updatedData,
        dTag,
        attachmentFiles,
        signer,
        (progress: MeetupPublishingProgress) => {
          setState((prev) => ({
            ...prev,
            updateProgress: progress,
          }));
          logger.debug('Update progress', {
            service: 'useMeetupEditing',
            method: 'updateMeetupContent',
            ...progress,
          });
        }
      );

      if (result.success) {
        logger.info('Meetup updated successfully', {
          service: 'useMeetupEditing',
          method: 'updateMeetupContent',
          dTag: result.dTag,
          eventId: result.eventId,
        });

        setState({
          isUpdating: false,
          updateProgress: null,
          updateError: null,
          updateResult: result,
        });
      } else {
        logger.error('Meetup update failed', new Error(result.error || 'Unknown error'), {
          service: 'useMeetupEditing',
          method: 'updateMeetupContent',
        });

        setState({
          isUpdating: false,
          updateProgress: null,
          updateError: result.error || 'Failed to update meetup',
          updateResult: null,
        });
      }

      return result;
    } catch (err) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to update meetup',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.INTERNAL,
            ErrorSeverity.HIGH
          );

      logger.error('Exception during meetup update', appError, {
        service: 'useMeetupEditing',
        method: 'updateMeetupContent',
      });

      setState({
        isUpdating: false,
        updateProgress: null,
        updateError: appError.message,
        updateResult: null,
      });

      return { success: false, error: appError.message };
    }
  }, [getSigner]);

  return {
    updateMeetupContent,
    isUpdating: state.isUpdating,
    updateProgress: state.updateProgress,
    updateError: state.updateError,
    updateResult: state.updateResult,
  };
}
