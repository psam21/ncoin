'use client';

import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/services/core/LoggingService';
import { 
  fetchUserMeetups, 
  deleteMeetup, 
  filterUpcomingMeetups, 
  filterPastMeetups 
} from '@/services/business/MeetService';
import type { MeetupEvent } from '@/types/meetup';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNostrSigner } from './useNostrSigner';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

/**
 * Hook for fetching and managing user's own meetups
 * Fetches directly by pubkey (not filtering all meetups)
 * Auto-loads meetups on mount when authenticated
 * Supports upcoming/past filtering and deletion
 */
export function useMyMeetups() {
  const { user, isAuthenticated } = useAuthStore();
  const { signer } = useNostrSigner();
  const pubkey = user?.pubkey;

  const [meetups, setMeetups] = useState<MeetupEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Load user's meetups
   * Fetches by pubkey directly (more efficient than filtering all)
   */
  const loadMyMeetups = useCallback(async () => {
    if (!pubkey || !isAuthenticated) {
      logger.warn('Cannot load meetups: not authenticated', {
        service: 'useMyMeetups',
        method: 'loadMyMeetups',
        hasPubkey: !!pubkey,
        isAuthenticated,
      });
      return;
    }

    try {
      logger.info('Loading user meetups', {
        service: 'useMyMeetups',
        method: 'loadMyMeetups',
        pubkey: pubkey.substring(0, 8) + '...',
      });

      setIsLoading(true);
      setError(null);

      // Fetch user's meetups by pubkey
      const userMeetups = await fetchUserMeetups(pubkey);
      
      // Sort by newest first
      const sorted = userMeetups.sort((a, b) => b.createdAt - a.createdAt);
      
      setMeetups(sorted);

      logger.info('User meetups loaded', {
        service: 'useMyMeetups',
        method: 'loadMyMeetups',
        meetupCount: sorted.length,
      });
    } catch (err) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to load meetups',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.EXTERNAL_SERVICE,
            ErrorSeverity.MEDIUM
          );

      logger.error('Error loading user meetups', appError, {
        service: 'useMyMeetups',
        method: 'loadMyMeetups',
        pubkey: pubkey?.substring(0, 8) + '...',
      });
      
      setError(appError.message);
    } finally {
      setIsLoading(false);
    }
  }, [pubkey, isAuthenticated]);

  /**
   * Delete a meetup
   * 
   * @param eventId - Event ID to delete
   * @param title - Meetup title (for deletion reason)
   */
  const deleteMeetupById = useCallback(async (
    eventId: string,
    title: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!signer || !pubkey) {
      const error = 'No signer or pubkey available. Please sign in first.';
      logger.error('Delete meetup failed: no signer/pubkey', new Error(error), {
        service: 'useMyMeetups',
        method: 'deleteMeetupById',
      });
      return { success: false, error };
    }

    try {
      logger.info('Deleting meetup', {
        service: 'useMyMeetups',
        method: 'deleteMeetupById',
        eventId,
        title,
      });

      setIsDeleting(true);

      const result = await deleteMeetup(eventId, signer, pubkey, title);

      if (result.success) {
        logger.info('Meetup deleted successfully', {
          service: 'useMyMeetups',
          method: 'deleteMeetupById',
          eventId,
        });

        // Remove from local state
        setMeetups((prev) => prev.filter((m) => m.id !== eventId));
      } else {
        logger.error('Meetup deletion failed', new Error(result.error || 'Unknown error'), {
          service: 'useMyMeetups',
          method: 'deleteMeetupById',
        });
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete meetup';
      
      logger.error('Exception during meetup deletion', err instanceof Error ? err : new Error(errorMessage), {
        service: 'useMyMeetups',
        method: 'deleteMeetupById',
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsDeleting(false);
    }
  }, [signer, pubkey]);

  /**
   * Get upcoming meetups only
   */
  const upcomingMeetups = useCallback(() => {
    return filterUpcomingMeetups(meetups);
  }, [meetups]);

  /**
   * Get past meetups only
   */
  const pastMeetups = useCallback(() => {
    return filterPastMeetups(meetups);
  }, [meetups]);

  // Auto-load on mount when authenticated (PAGE REFRESH behavior)
  useEffect(() => {
    if (pubkey && isAuthenticated) {
      loadMyMeetups();
    }
  }, [pubkey, isAuthenticated, loadMyMeetups]);

  return {
    meetups,
    isLoading,
    error,
    isDeleting,
    loadMyMeetups, // Manual refresh
    deleteMeetupById,
    upcomingMeetups, // Filter helper
    pastMeetups, // Filter helper
  };
}
