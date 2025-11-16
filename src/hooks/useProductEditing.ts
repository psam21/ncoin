'use client';

import { useContentEditing } from './useContentEditing';
import type { SimpleUpdateFunction } from './useContentEditing';
import { updateProductWithAttachments } from '@/services/business/ShopService';
import type { ProductData, UpdateProductResult, ProductPublishingProgress } from '@/types/shop';

/**
 * Hook for editing existing products
 * Uses generic useContentEditing wrapper for consistent edit flows
 * 
 * This hook provides:
 * - Decoupled state management (not tied to useMyShopStore)
 * - Support for selective attachment operations (keep/remove)
 * - Progress tracking during updates
 * - Dedicated updateProductWithAttachments() function call
 * 
 * @returns Object with updateContent function and state
 */
export function useProductEditing() {
  // Define update function that matches SimpleUpdateFunction signature
  const updateFn: SimpleUpdateFunction<ProductData, UpdateProductResult, ProductPublishingProgress> = async (
    contentId,
    updatedData,
    attachmentFiles,
    signer,
    onProgress,
    selectiveOps
  ) => {
    // Transform selectiveOps from generic format to Shop-specific format
    const shopSelectiveOps = selectiveOps ? {
      keep: selectiveOps.keptAttachments,
      remove: selectiveOps.removedAttachments,
    } : undefined;

    // Call the dedicated update function with selective operations support
    return await updateProductWithAttachments(
      contentId,
      updatedData as ProductData,
      attachmentFiles,
      signer,
      shopSelectiveOps,
      onProgress
    );
  };

  // Use generic content editing hook (requiresPubkey = false for Shop)
  return useContentEditing<ProductData, UpdateProductResult, ProductPublishingProgress>(
    'useProductEditing',
    updateFn,
    false // Shop doesn't need pubkey parameter in update function
  );
}

