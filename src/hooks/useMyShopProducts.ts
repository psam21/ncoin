'use client';

import { useCallback, useEffect, useState } from 'react';
import { logger } from '@/services/core/LoggingService';
import { fetchPublicProducts, type RelayProgress } from '@/services/business/ShopService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMyShopStore } from '@/stores/useMyShopStore';

/**
 * Hook for fetching and managing user's own products
 * Integrates with useMyShopStore for state management
 * Pattern from temp-cb-reference: Fetch all products, filter by user's pubkey
 * Auto-loads products on mount when authenticated
 */
export function useMyShopProducts() {
  const { user, isAuthenticated } = useAuthStore();
  const pubkey = user?.pubkey;
  const [relayProgress, setRelayProgress] = useState<RelayProgress | null>(null);

  const {
    myProducts,
    isLoadingMyProducts,
    myProductsError,
    setMyProducts,
    setLoadingMyProducts,
    setMyProductsError,
  } = useMyShopStore();

  /**
   * Load user's products
   * Pattern: Fetch all → filter by pubkey (client-side)
   */
  const loadMyProducts = useCallback(async () => {
    if (!pubkey || !isAuthenticated) {
      logger.warn('Cannot load products: not authenticated', {
        service: 'useMyShopProducts',
        method: 'loadMyProducts',
        hasPubkey: !!pubkey,
        isAuthenticated,
      });
      return;
    }

    try {
      logger.info('Loading user products', {
        service: 'useMyShopProducts',
        method: 'loadMyProducts',
        pubkey: pubkey.substring(0, 8) + '...',
      });

      setLoadingMyProducts(true);
      setMyProductsError(null);
      setRelayProgress(null);

      // Fetch ALL products from relays with progress tracking
      const allProducts = await fetchPublicProducts(100, undefined, (progress: RelayProgress) => {
        setRelayProgress(progress);
        logger.debug('Relay query progress (my products)', {
          service: 'useMyShopProducts',
          method: 'loadMyProducts',
          ...progress,
        });
      }); // Higher limit for user's products
      
      // Filter by current user's pubkey (client-side)
      const userProducts = allProducts.filter(p => p.pubkey === pubkey);
      
      // Sort by newest first
      const sorted = userProducts.sort((a, b) => b.createdAt - a.createdAt);
      
      // Update store
      setMyProducts(sorted);

      logger.info('User products loaded', {
        service: 'useMyShopProducts',
        method: 'loadMyProducts',
        totalFetched: allProducts.length,
        userProducts: sorted.length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load products';
      logger.error('Error loading user products', error as Error, {
        service: 'useMyShopProducts',
        method: 'loadMyProducts',
        pubkey: pubkey?.substring(0, 8) + '...',
      });
      setMyProductsError(errorMessage);
    } finally {
      setLoadingMyProducts(false);
    }
  }, [pubkey, isAuthenticated, setMyProducts, setLoadingMyProducts, setMyProductsError]);

  // Auto-load on mount when authenticated (PAGE REFRESH behavior)
  useEffect(() => {
    if (pubkey && isAuthenticated) {
      loadMyProducts();
    }
  }, [pubkey, isAuthenticated, loadMyProducts]);

  return {
    products: myProducts,
    isLoading: isLoadingMyProducts,
    error: myProductsError,
    loadMyProducts, // Manual refresh
    relayProgress, // Expose relay connection progress
  };
}
