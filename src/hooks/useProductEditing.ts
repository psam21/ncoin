'use client';

import { useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useMyShopStore } from '@/stores/useMyShopStore';
import { createProduct } from '@/services/business/ShopService';
import type { ProductData, ProductPublishingProgress } from '@/types/shop';
import { logger } from '@/services/core/LoggingService';

/**
 * Hook for editing products
 * Integrates with useMyShopStore for state management
 * Handles product updates with progress tracking
 */
export function useProductEditing() {
  const { getSigner } = useNostrSigner();
  
  const {
    editingProduct,
    isEditing,
    isUpdating,
    updateProgress,
    updateError,
    startEditing,
    cancelEditing,
    setUpdating,
    setUpdateProgress,
    setUpdateError,
  } = useMyShopStore();

  /**
   * Update a product (reuses createProduct with existing dTag)
   */
  const updateProduct = useCallback(
    async (data: ProductData, files: File[]) => {
      if (!editingProduct) {
        throw new Error('No product is being edited');
      }

      try {
        logger.info('Updating product', {
          service: 'useProductEditing',
          method: 'updateProduct',
          productId: editingProduct.id,
          dTag: editingProduct.dTag,
        });

        setUpdating(true);
        setUpdateError(null);
        setUpdateProgress(null);

        const signer = await getSigner();
        if (!signer) {
          throw new Error('No signer available');
        }

        const result = await createProduct(
          data,
          files,
          signer,
          editingProduct.dTag, // Use existing dTag for update
          (progress: ProductPublishingProgress) => {
            setUpdateProgress(progress);
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to update product');
        }

        logger.info('Product updated successfully', {
          service: 'useProductEditing',
          method: 'updateProduct',
          eventId: result.eventId,
        });

        // Clear editing state on success
        cancelEditing();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update product';
        logger.error('Error updating product', error as Error, {
          service: 'useProductEditing',
          method: 'updateProduct',
        });
        setUpdateError(errorMessage);
        throw error;
      } finally {
        setUpdating(false);
      }
    },
    [editingProduct, getSigner, setUpdating, setUpdateError, setUpdateProgress, cancelEditing]
  );

  return {
    editingProduct,
    isEditing,
    isUpdating,
    updateProgress,
    updateError,
    startEditing,
    cancelEditing,
    updateProduct,
  };
}
