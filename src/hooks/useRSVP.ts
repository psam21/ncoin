'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { createRSVP, fetchRSVPs } from '@/services/business/MeetService';
import type { RSVPData, ParsedRSVP } from '@/types/meetup';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNostrSigner } from './useNostrSigner';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

/**
 * Hook for managing RSVP to a single meetup
 * Fetches all RSVPs for the meetup and tracks user's RSVP status
 * Provides method to create/update RSVP
 */
export function useRSVP(eventDTag: string, eventPubkey: string) {
  const { user, isAuthenticated } = useAuthStore();
  const { signer } = useNostrSigner();
  const userPubkey = user?.pubkey;

  const [allRSVPs, setAllRSVPs] = useState<ParsedRSVP[]>([]);
  const [myRSVP, setMyRSVP] = useState<ParsedRSVP | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Load RSVPs for the meetup
   */
  const loadRSVPs = useCallback(async () => {
    try {
      logger.info('Loading RSVPs for meetup', {
        service: 'useRSVP',
        method: 'loadRSVPs',
        eventDTag,
        eventPubkey: eventPubkey.substring(0, 8) + '...',
      });

      setIsLoading(true);
      setError(null);

      const rsvps = await fetchRSVPs(eventDTag, eventPubkey);
      setAllRSVPs(rsvps);

      // Find user's RSVP if authenticated
      if (userPubkey) {
        const userRSVP = rsvps.find((r) => r.pubkey === userPubkey);
        setMyRSVP(userRSVP || null);
      }

      logger.info('RSVPs loaded', {
        service: 'useRSVP',
        method: 'loadRSVPs',
        totalRSVPs: rsvps.length,
        hasUserRSVP: !!myRSVP,
      });
    } catch (err) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to load RSVPs',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.EXTERNAL_SERVICE,
            ErrorSeverity.MEDIUM
          );

      logger.error('Error loading RSVPs', appError, {
        service: 'useRSVP',
        method: 'loadRSVPs',
      });
      
      setError(appError.message);
    } finally {
      setIsLoading(false);
    }
  }, [eventDTag, eventPubkey, userPubkey, myRSVP]);

  /**
   * RSVP to the meetup (create or update)
   * 
   * @param status - RSVP status ('accepted', 'declined', 'tentative')
   * @param comment - Optional comment
   */
  const rsvp = useCallback(async (
    status: 'accepted' | 'declined' | 'tentative',
    comment?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!signer || !isAuthenticated) {
      const error = 'Please sign in to RSVP';
      logger.error('RSVP failed: not authenticated', new Error(error), {
        service: 'useRSVP',
        method: 'rsvp',
      });
      setError(error);
      return { success: false, error };
    }

    try {
      logger.info('Creating RSVP', {
        service: 'useRSVP',
        method: 'rsvp',
        status,
        hasComment: !!comment,
      });

      setIsSubmitting(true);
      setError(null);

      const rsvpData: RSVPData = {
        eventDTag,
        eventPubkey,
        status,
        comment,
      };

      const result = await createRSVP(rsvpData, signer);

      if (result.success) {
        logger.info('RSVP created successfully', {
          service: 'useRSVP',
          method: 'rsvp',
          status,
        });

        // Reload RSVPs to get latest state
        await loadRSVPs();
      } else {
        logger.error('RSVP creation failed', new Error(result.error || 'Unknown error'), {
          service: 'useRSVP',
          method: 'rsvp',
        });
        setError(result.error || 'Failed to create RSVP');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create RSVP';
      
      logger.error('Exception during RSVP creation', err instanceof Error ? err : new Error(errorMessage), {
        service: 'useRSVP',
        method: 'rsvp',
      });

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [signer, isAuthenticated, eventDTag, eventPubkey, loadRSVPs]);

  /**
   * Get RSVP counts by status
   */
  const getRSVPCounts = useCallback(() => {
    return {
      accepted: allRSVPs.filter((r) => r.status === 'accepted').length,
      declined: allRSVPs.filter((r) => r.status === 'declined').length,
      tentative: allRSVPs.filter((r) => r.status === 'tentative').length,
      total: allRSVPs.length,
    };
  }, [allRSVPs]);

  // Auto-load RSVPs on mount
  useEffect(() => {
    loadRSVPs();
  }, [loadRSVPs]);

  return {
    allRSVPs,
    myRSVP,
    isLoading,
    error,
    isSubmitting,
    rsvp,
    loadRSVPs, // Manual refresh
    getRSVPCounts,
  };
}
