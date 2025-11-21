'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { logger } from '@/services/core/LoggingService';
import { fetchPublicWorkOpportunities, type WorkExploreItem } from '@/services/business/WorkService';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

export interface WorkFilters {
  searchTerm: string;
  category: string;
  jobType: string;
  region: string;
  sortBy: 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'payrate-desc';
}

export function usePublicWorkOpportunities(filters?: WorkFilters) {
  const [workItems, setWorkItems] = useState<WorkExploreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    try {
      logger.info('Loading initial work opportunity items', {
        service: 'usePublicWorkOpportunities',
        method: 'loadInitial',
        limit: 8,
      });

      setIsLoading(true);
      setError(null);

      // Call business service
      const items = await fetchPublicWorkOpportunities(8);
      
      setWorkItems(items);
      setHasMore(items.length === 8);

      logger.info('Initial work opportunity items loaded', {
        service: 'usePublicWorkOpportunities',
        method: 'loadInitial',
        itemCount: items.length,
        hasMore: items.length === 8,
      });
    } catch (err) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to load work opportunities',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.EXTERNAL_SERVICE,
            ErrorSeverity.MEDIUM
          );
      
      logger.error('Error loading initial work opportunity items', appError, {
        service: 'usePublicWorkOpportunities',
        method: 'loadInitial',
      });
      
      setError(appError.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || workItems.length === 0) {
      return;
    }

    try {
      logger.info('Loading more work opportunity items', {
        service: 'usePublicWorkOpportunities',
        method: 'loadMore',
        currentCount: workItems.length,
      });

      setIsLoadingMore(true);

      const lastTimestamp = workItems[workItems.length - 1].publishedAt;
      
      // Call business service
      const newItems = await fetchPublicWorkOpportunities(6, lastTimestamp);
      
      setWorkItems(prev => {
        const existingDTags = new Set(prev.map(item => item.dTag));
        const uniqueNewItems = newItems.filter(item => !existingDTags.has(item.dTag));
        return [...prev, ...uniqueNewItems];
      });
      
      setHasMore(newItems.length === 6);

      logger.info('More work opportunity items loaded', {
        service: 'usePublicWorkOpportunities',
        method: 'loadMore',
        newItemCount: newItems.length,
        totalCount: workItems.length + newItems.length,
        hasMore: newItems.length === 6,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more work opportunities';
      
      logger.error('Error loading more work opportunity items', err instanceof Error ? err : new Error(errorMessage), {
        service: 'usePublicWorkOpportunities',
        method: 'loadMore',
      });
      
      logger.warn('Load more failed, but keeping existing items', {
        service: 'usePublicWorkOpportunities',
        method: 'loadMore',
        error: errorMessage,
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [workItems, isLoadingMore, hasMore]);

  const refetch = useCallback(() => {
    logger.info('Refetching work opportunity items', {
      service: 'usePublicWorkOpportunities',
      method: 'refetch',
    });
    
    setWorkItems([]);
    setHasMore(true);
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // Extract unique categories, job types, and regions from loaded data
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    workItems.forEach(item => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set).sort();
  }, [workItems]);

  const availableJobTypes = useMemo(() => {
    const set = new Set<string>();
    workItems.forEach(item => {
      if (item.jobType) set.add(item.jobType);
    });
    return Array.from(set).sort();
  }, [workItems]);

  const availableRegions = useMemo(() => {
    const set = new Set<string>();
    workItems.forEach(item => {
      if (item.region) set.add(item.region);
    });
    return Array.from(set).sort();
  }, [workItems]);

  // Apply client-side filtering and sorting
  const filteredAndSortedItems = useMemo(() => {
    if (!filters) return workItems;

    let filtered = [...workItems];

    // Apply search filter
    if (filters.searchTerm.trim()) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(term) ||
        item.location.toLowerCase().includes(term) ||
        item.region.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.category.toLowerCase().includes(term) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    // Apply category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter((item) => item.category === filters.category);
    }

    // Apply job type filter
    if (filters.jobType !== 'all') {
      filtered = filtered.filter((item) => item.jobType === filters.jobType);
    }

    // Apply region filter
    if (filters.region !== 'all') {
      filtered = filtered.filter((item) => item.region === filters.region);
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => a.publishedAt - b.publishedAt);
        break;
      case 'title-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'title-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'payrate-desc':
        filtered.sort((a, b) => b.payRate - a.payRate);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.publishedAt - a.publishedAt);
        break;
    }

    return filtered;
  }, [workItems, filters]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    if (!filters) return 0;
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.category !== 'all') count++;
    if (filters.jobType !== 'all') count++;
    if (filters.region !== 'all') count++;
    return count;
  }, [filters]);

  return {
    workItems: filteredAndSortedItems,
    allItems: workItems,
    isLoading,
    error,
    refetch,
    loadMore,
    isLoadingMore,
    hasMore,
    availableCategories,
    availableJobTypes,
    availableRegions,
    activeFilterCount,
  };
}
