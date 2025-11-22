'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { fetchPublicMeetups } from '@/services/generic/GenericMeetService';
import type { MeetupCardData } from '@/types/meetup';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

/**
 * Relay progress interface (matching service layer)
 */
interface RelayProgress {
  step: string;
  progress: number;
  message: string;
}

/**
 * Filter upcoming meetups (local utility)
 */
function filterUpcomingMeetups(meetups: MeetupCardData[]): MeetupCardData[] {
  const now = Math.floor(Date.now() / 1000);
  return meetups
    .filter((m) => m.startTime > now)
    .sort((a, b) => a.startTime - b.startTime);
}

/**
 * Hook for fetching and managing public meetups for browse/explore view
 * Supports filtering by upcoming meetups
 * Auto-loads meetups on mount and on every page visit
 */
export function usePublicMeetups(limit = 20, upcomingOnly = false) {
  const [meetups, setMeetups] = useState<MeetupCardData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [relayProgress] = useState<RelayProgress | null>(null); // Reserved for future relay progress

  /**
   * Load initial meetups
   */
  const loadInitial = useCallback(async () => {
    try {
      logger.info('Loading initial meetups', {
        service: 'usePublicMeetups',
        method: 'loadInitial',
        limit,
        upcomingOnly,
      });

      setIsLoading(true);
      setError(null);

      const items = await fetchPublicMeetups(limit);
      
      // Apply upcoming filter if requested
      const filteredItems = upcomingOnly ? filterUpcomingMeetups(items) : items;
      setMeetups(filteredItems);
      setHasMore(items.length === limit);

      logger.info('Initial meetups loaded', {
        service: 'usePublicMeetups',
        method: 'loadInitial',
        itemCount: items.length,
        filteredCount: filteredItems.length,
        hasMore: items.length === limit,
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
      
      logger.error('Error loading initial meetups', appError, {
        service: 'usePublicMeetups',
        method: 'loadInitial',
      });
      
      setError(appError.message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, upcomingOnly]);

  /**
   * Load more meetups for pagination
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || meetups.length === 0) {
      return;
    }

    try {
      logger.info('Loading more meetups', {
        service: 'usePublicMeetups',
        method: 'loadMore',
        currentCount: meetups.length,
      });

      setIsLoadingMore(true);

      const lastTimestamp = meetups[meetups.length - 1].createdAt;
      const newItems = await fetchPublicMeetups(limit, lastTimestamp);
      
      // Apply upcoming filter if requested
      const filteredItems = upcomingOnly ? filterUpcomingMeetups(newItems) : newItems;
      setMeetups([...meetups, ...filteredItems]);
      setHasMore(newItems.length === limit);

      logger.info('More meetups loaded', {
        service: 'usePublicMeetups',
        method: 'loadMore',
        newItemCount: newItems.length,
        filteredNewCount: filteredItems.length,
        totalCount: meetups.length + filteredItems.length,
        hasMore: newItems.length === limit,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more meetups';
      
      logger.error('Error loading more meetups', err instanceof Error ? err : new Error(errorMessage), {
        service: 'usePublicMeetups',
        method: 'loadMore',
      });
      
      logger.warn('Load more failed, but keeping existing meetups', {
        service: 'usePublicMeetups',
        method: 'loadMore',
        error: errorMessage,
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [meetups, isLoadingMore, hasMore, limit, upcomingOnly]);

  /**
   * Refresh meetups (re-fetch from relays)
   */
  const refresh = useCallback(() => {
    logger.info('Refreshing meetups', {
      service: 'usePublicMeetups',
      method: 'refresh',
    });
    
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  // Auto-load on mount (PAGE REFRESH behavior)
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    meetups,
    isLoading,
    error,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
    relayProgress, // Expose relay connection progress
  };
}
