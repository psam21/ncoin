'use client';

import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { fetchPublicProducts, type RelayProgress } from '@/services/business/ShopService';
import { useShopStore } from '@/stores/useShopStore';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

/**
 * Hook for fetching and managing public products for browse/explore view
 * Integrates with useShopStore for state management
 * Auto-loads products on mount and on every page visit
 */
export function usePublicProducts(limit = 20) {
  const {
    products,
    isLoadingProducts,
    productsError,
    setProducts,
    setLoadingProducts,
    setProductsError,
  } = useShopStore();

  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [relayProgress, setRelayProgress] = useState<RelayProgress | null>(null);

  /**
   * Load initial products
   */
  const loadInitial = useCallback(async () => {
    try {
      logger.info('Loading initial products', {
        service: 'usePublicProducts',
        method: 'loadInitial',
        limit,
      });

      setLoadingProducts(true);
      setProductsError(null);
      setRelayProgress(null);

      const items = await fetchPublicProducts(limit, undefined, (progress: RelayProgress) => {
        setRelayProgress(progress);
        logger.debug('Relay query progress', {
          service: 'usePublicProducts',
          method: 'loadInitial',
          ...progress,
        });
      });
      
      setProducts(items);
      setHasMore(items.length === limit);

      logger.info('Initial products loaded', {
        service: 'usePublicProducts',
        method: 'loadInitial',
        itemCount: items.length,
        hasMore: items.length === limit,
      });
    } catch (err) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to load products',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.EXTERNAL_SERVICE,
            ErrorSeverity.MEDIUM
          );
      
      logger.error('Error loading initial products', appError, {
        service: 'usePublicProducts',
        method: 'loadInitial',
      });
      
      setProductsError(appError.message);
    } finally {
      setLoadingProducts(false);
    }
  }, [limit, setProducts, setLoadingProducts, setProductsError]);

  /**
   * Load more products for pagination
   */
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || products.length === 0) {
      return;
    }

    try {
      logger.info('Loading more products', {
        service: 'usePublicProducts',
        method: 'loadMore',
        currentCount: products.length,
      });

      setIsLoadingMore(true);
      setRelayProgress(null);

      const lastTimestamp = products[products.length - 1].createdAt;
      const newItems = await fetchPublicProducts(limit, lastTimestamp, (progress: RelayProgress) => {
        setRelayProgress(progress);
        logger.debug('Relay query progress (load more)', {
          service: 'usePublicProducts',
          method: 'loadMore',
          ...progress,
        });
      });
      
      setProducts([...products, ...newItems]);
      setHasMore(newItems.length === limit);

      logger.info('More products loaded', {
        service: 'usePublicProducts',
        method: 'loadMore',
        newItemCount: newItems.length,
        totalCount: products.length + newItems.length,
        hasMore: newItems.length === limit,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load more products';
      
      logger.error('Error loading more products', err instanceof Error ? err : new Error(errorMessage), {
        service: 'usePublicProducts',
        method: 'loadMore',
      });
      
      logger.warn('Load more failed, but keeping existing products', {
        service: 'usePublicProducts',
        method: 'loadMore',
        error: errorMessage,
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [products, isLoadingMore, hasMore, limit, setProducts]);

  /**
   * Refresh products (re-fetch from relays)
   */
  const refresh = useCallback(() => {
    logger.info('Refreshing products', {
      service: 'usePublicProducts',
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
    products,
    isLoading: isLoadingProducts,
    error: productsError,
    hasMore,
    isLoadingMore,
    loadMore,
    refresh,
    relayProgress, // Expose relay connection progress
  };
}
