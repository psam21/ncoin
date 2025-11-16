'use client';

import { useState, useCallback } from 'react';
import { useNostrSigner } from './useNostrSigner';
import { useContentPublishing } from './useContentPublishing';
import { createProduct } from '@/services/business/ShopService';
import type {
  ProductData,
  ProductPublishingResult,
  ProductPublishingProgress,
  ProductPublishingState,
} from '@/types/shop';

/**
 * Hook for publishing marketplace products
 * Manages publishing state and coordinates with shop service
 * 
 * Uses the generic content publishing wrapper for:
 * - Signer validation
 * - Consent dialog for file uploads
 * - Progress tracking
 * - Error handling
 * - Logging
 */
export function useShopPublishing() {
  const { isAvailable, getSigner } = useNostrSigner();
  
  // Publishing state
  const [state, setState] = useState<ProductPublishingState>({
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
    setProgress: (progress: ProductPublishingProgress | null) => {
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
    setResult: (result: ProductPublishingResult | null) => {
      setState(prev => ({
        ...prev,
        result,
        error: result && !result.success ? result.error || null : null,
      }));
    },
  };

  // Initialize generic publishing wrapper
  const { publishWithWrapper, consentDialog } = useContentPublishing<
    ProductData,
    ProductPublishingResult,
    ProductPublishingProgress
  >({
    serviceName: 'ShopService',
    methodName: 'createProduct',
    isAvailable,
    getSigner,
    stateSetters,
  });

  /**
   * Publish a product
   */
  const publishProduct = useCallback(
    async (
      data: ProductData,
      attachmentFiles: File[],
      existingDTag?: string
    ): Promise<ProductPublishingResult> => {
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
      // But createProduct expects: (data, files, signer, existingDTag, onProgress)
      const result = await publishWithWrapper(
        async (productData, files, signer, onProgress) => {
          const serviceResult = await createProduct(
            productData,
            files,
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
    publishProduct,
    reset: resetPublishing,
    
    // Consent dialog (from generic wrapper)
    consentDialog,
  };
}
