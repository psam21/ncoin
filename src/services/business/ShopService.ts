import { logger } from '@/services/core/LoggingService';
import type { ProductData, ProductPublishingProgress, ProductEvent, ProductExploreItem } from '@/types/shop';
import { validateProductData } from './ProductValidationService';
import { nostrEventService } from '../nostr/NostrEventService';
import type { NostrSigner, NostrEvent } from '@/types/nostr';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';
import { fetchPublicProducts as fetchPublicProductsFromRelay, extractMedia } from '@/services/generic/GenericShopService';
import { queryEvents } from '@/services/generic/GenericRelayService';
import { createDeletionEvent, signEvent } from '@/services/generic/GenericEventService';

export interface ProductPublishingResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  error?: string;
  [key: string]: unknown; // For generic wrapper compatibility
}

/**
 * Create a new product with file upload, event creation and publishing
 * Orchestrates: validation → upload → event creation → publishing
 * 
 * @param productData - Product data (attachments can be empty, will be populated from files)
 * @param attachmentFiles - File objects to upload (empty array if no files)
 * @param signer - Nostr signer for signing events and uploads
 * @param existingDTag - Optional dTag for updates (undefined for new products)
 * @param onProgress - Optional callback for progress updates
 */
export async function createProduct(
  productData: ProductData,
  attachmentFiles: File[],
  signer: NostrSigner,
  existingDTag?: string,
  onProgress?: (progress: ProductPublishingProgress) => void
): Promise<ProductPublishingResult> {
  try {
    logger.info('Starting product creation', {
      service: 'ShopService',
      method: 'createProduct',
      title: productData.title,
      isEdit: !!existingDTag,
      attachmentFilesCount: attachmentFiles.length,
    });

    // Step 1: Validate product data
    onProgress?.({
      step: 'validating',
      progress: 10,
      message: 'Validating product...',
      details: 'Checking required fields',
    });

    const validation = validateProductData(productData);
    if (!validation.valid) {
      const errorMsg = Object.values(validation.errors).join(', ');
      logger.error('Product validation failed', new Error(errorMsg), {
        service: 'ShopService',
        method: 'createProduct',
        errors: validation.errors,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    // Step 2: Upload attachment files (if any)
    const uploadedAttachments: Array<{
      type: 'image' | 'video' | 'audio';
      url: string;
      hash: string;
      name: string;
      id: string;
      size: number;
      mimeType: string;
    }> = [];

    if (attachmentFiles.length > 0) {
      onProgress?.({
        step: 'uploading',
        progress: 30,
        message: 'Uploading media files...',
        details: `Uploading ${attachmentFiles.length} file(s)`,
      });

      logger.info('Uploading attachment files', {
        service: 'ShopService',
        method: 'createProduct',
        fileCount: attachmentFiles.length,
      });

      const uploadResult = await uploadSequentialWithConsent(
        attachmentFiles,
        signer,
        (uploadProgress) => {
          // Map upload progress (0-1) to publishing progress (30-70)
          const progressPercent = 30 + (40 * uploadProgress.overallProgress);
          onProgress?.({
            step: 'uploading',
            progress: progressPercent,
            message: uploadProgress.nextAction,
            details: `File ${uploadProgress.currentFileIndex + 1} of ${uploadProgress.totalFiles}`,
            attachmentProgress: {
              current: uploadProgress.currentFileIndex + 1,
              total: uploadProgress.totalFiles,
              currentFile: uploadProgress.currentFile.name,
            },
          });
        }
      );

      // Check for cancellation or failure
      if (uploadResult.userCancelled) {
        return {
          success: false,
          error: 'User cancelled upload',
        };
      }

      if (uploadResult.successCount === 0) {
        return {
          success: false,
          error: 'All media uploads failed',
        };
      }

      // Map uploaded files to attachment format
      for (let i = 0; i < uploadResult.uploadedFiles.length; i++) {
        const uploadedFile = uploadResult.uploadedFiles[i];
        const originalFile = attachmentFiles[i];
        
        // Determine media type from MIME type
        const mimeType = originalFile.type;
        let type: 'image' | 'video' | 'audio' = 'image';
        if (mimeType.startsWith('video/')) type = 'video';
        else if (mimeType.startsWith('audio/')) type = 'audio';

        uploadedAttachments.push({
          type,
          url: uploadedFile.url,
          hash: uploadedFile.hash,
          name: originalFile.name,
          id: `${uploadedFile.hash}-${Date.now()}`,
          size: originalFile.size,
          mimeType,
        });
      }

      logger.info('Media upload completed', {
        service: 'ShopService',
        method: 'createProduct',
        uploadedCount: uploadedAttachments.length,
      });
    }

    // Step 3: Create product event
    onProgress?.({
      step: 'publishing',
      progress: 75,
      message: 'Creating product event...',
      details: 'Signing event',
    });

    const dataWithAttachments = {
      ...productData,
      attachments: uploadedAttachments,
    };

    logger.info('Creating product event', {
      service: 'ShopService',
      method: 'createProduct',
      hasExistingDTag: !!existingDTag,
    });

    const event = await nostrEventService.createProductEvent(
      dataWithAttachments,
      signer,
      existingDTag
    );

    // Extract dTag before publishing
    const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
    if (!dTag) {
      throw new Error('Created event missing required d tag');
    }

    // Step 4: Publish to relays
    onProgress?.({
      step: 'publishing',
      progress: 85,
      message: 'Publishing to relays...',
      details: 'Broadcasting event',
    });

    logger.info('Publishing product event to relays', {
      service: 'ShopService',
      method: 'createProduct',
      eventId: event.id,
    });

    const publishResult = await nostrEventService.publishEvent(event, signer);

    if (!publishResult.success) {
      logger.error('Product event publishing failed', new Error(publishResult.error || 'Unknown error'), {
        service: 'ShopService',
        method: 'createProduct',
      });
      return {
        success: false,
        error: publishResult.error || 'Failed to publish event',
      };
    }

    // Step 5: Complete
    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Product published successfully!',
      details: `Published to ${publishResult.publishedRelays?.length || 0} relays`,
    });

    logger.info('Product created successfully', {
      service: 'ShopService',
      method: 'createProduct',
      eventId: event.id,
      dTag,
    });

    return {
      success: true,
      eventId: event.id,
      dTag,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Product creation failed', error as Error, {
      service: 'ShopService',
      method: 'createProduct',
    });
    
    onProgress?.({
      step: 'complete',
      progress: 0,
      message: 'Publishing failed',
      details: errorMessage,
    });
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch products by author pubkey
 * Business layer method for querying user's own products
 * 
 * @param pubkey - Author's public key
 * @returns Array of product events authored by this user
 */
export async function fetchProductsByAuthor(
  pubkey: string
): Promise<ProductEvent[]> {
  try {
    logger.info('Fetching products by author', {
      service: 'ShopService',
      method: 'fetchProductsByAuthor',
      pubkey,
    });

    const filter = {
      kinds: [30023],
      authors: [pubkey],
      '#t': ['nostr-for-nomads-shop'],
    };

    const queryResult = await queryEvents([filter]);
    
    if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
      return [];
    }
    
    // Parse and deduplicate by dTag
    const productMap = new Map<string, ProductEvent>();
    
    for (const event of queryResult.events) {
      const dTag = event.tags.find((t: string[]) => t[0] === 'd')?.[1];
      if (!dTag) continue;
      
      // Keep most recent version (NIP-33 replaceable)
      const existing = productMap.get(dTag);
      if (!existing || event.created_at > existing.createdAt) {
        const parsed = parseProductEvent(event);
        if (parsed) {
          productMap.set(dTag, parsed);
        }
      }
    }

    const products = Array.from(productMap.values());
    
    logger.info('Products fetched successfully', {
      service: 'ShopService',
      method: 'fetchProductsByAuthor',
      count: products.length,
    });

    return products;
  } catch (error) {
    logger.error('Failed to fetch products by author', error as Error, {
      service: 'ShopService',
      method: 'fetchProductsByAuthor',
      pubkey,
    });
    return [];
  }
}

/**
 * Fetch a single product by dTag
 * Business layer method for retrieving specific product (for edit page)
 * 
 * @param dTag - The product's dTag identifier
 * @returns Product event or null if not found
 */
export async function fetchProductById(
  dTag: string
): Promise<ProductEvent | null> {
  try {
    logger.info('Fetching product by ID', {
      service: 'ShopService',
      method: 'fetchProductById',
      dTag,
    });

    const filters = [
      {
        kinds: [30023],
        '#d': [dTag],
        '#t': ['nostr-for-nomads-shop'],
      }
    ];

    const queryResult = await queryEvents(filters);
    
    if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
      return null;
    }

    // Get most recent (NIP-33 replaceable)
    const mostRecent = queryResult.events.sort((a, b) => b.created_at - a.created_at)[0];

    const parsed = parseProductEvent(mostRecent);
    
    logger.info('Product fetched successfully', {
      service: 'ShopService',
      method: 'fetchProductById',
      found: !!parsed,
    });

    return parsed;
  } catch (error) {
    logger.error('Failed to fetch product by ID', error as Error, {
      service: 'ShopService',
      method: 'fetchProductById',
      dTag,
    });
    return null;
  }
}

/**
 * Delete a product by publishing NIP-09 deletion event
 * Business layer method for deleting user's own product
 * 
 * @param eventId - The event ID to delete
 * @param signer - Nostr signer
 * @param pubkey - Author's public key
 * @param title - Product title (for deletion reason)
 * @returns Result with success status and relay publishing info
 */
export async function deleteProduct(
  eventId: string,
  signer: NostrSigner,
  pubkey: string,
  title: string
): Promise<{ success: boolean; publishedRelays?: string[]; failedRelays?: string[]; error?: string }> {
  try {
    logger.info('Deleting product', {
      service: 'ShopService',
      method: 'deleteProduct',
      eventId,
      title,
    });

    const deletionResult = createDeletionEvent(
      [eventId],
      pubkey,
      {
        reason: `Deleted product: ${title}`,
      }
    );

    if (!deletionResult.success || !deletionResult.event) {
      throw new Error(deletionResult.error || 'Failed to create deletion event');
    }

    // Sign the deletion event
    const signResult = await signEvent(deletionResult.event, signer);

    if (!signResult.success || !signResult.signedEvent) {
      throw new Error(signResult.error || 'Failed to sign deletion event');
    }

    // Publish deletion event
    const publishResult = await nostrEventService.publishEvent(
      signResult.signedEvent as NostrEvent,
      signer
    );

    if (!publishResult.success) {
      logger.error('Failed to publish deletion event', new Error(publishResult.error), {
        service: 'ShopService',
        method: 'deleteProduct',
        eventId,
      });
      return {
        success: false,
        error: publishResult.error,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    const result = publishResult;

    logger.info('Product deleted', {
      service: 'ShopService',
      method: 'deleteProduct',
      success: result.success,
      publishedRelays: result.publishedRelays?.length,
    });

    return result;
  } catch (error) {
    logger.error('Failed to delete product', error as Error, {
      service: 'ShopService',
      method: 'deleteProduct',
      eventId,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch public products for browse/listing view
 * Business layer method that orchestrates fetching and data transformation
 * 
 * @param limit - Maximum number of products to fetch
 * @param until - Optional timestamp for pagination
 * @returns Array of product explore items ready for display
 */
export async function fetchPublicProducts(
  limit: number = 20,
  until?: number
): Promise<ProductExploreItem[]> {
  try {
    logger.info('Fetching public products', {
      service: 'ShopService',
      method: 'fetchPublicProducts',
      limit,
      until,
    });

    const products = await fetchPublicProductsFromRelay(limit, until);
    
    logger.info('Public products fetched', {
      service: 'ShopService',
      method: 'fetchPublicProducts',
      count: products.length,
    });

    return products;
  } catch (error) {
    logger.error('Failed to fetch public products', error as Error, {
      service: 'ShopService',
      method: 'fetchPublicProducts',
    });
    return [];
  }
}

/**
 * Parse a Nostr event into a ProductEvent
 * Helper function for transforming relay events
 */
function parseProductEvent(event: NostrEvent): ProductEvent | null {
  try {
    const dTag = event.tags.find((t: string[]) => t[0] === 'd')?.[1];
    if (!dTag) return null;

    const title = event.tags.find((t: string[]) => t[0] === 'title')?.[1] || '';
    const price = parseFloat(event.tags.find((t: string[]) => t[0] === 'price')?.[1] || '0');
    const currency = event.tags.find((t: string[]) => t[0] === 'currency')?.[1] || 'USD';
    const category = event.tags.find((t: string[]) => t[0] === 'category')?.[1] || 'other';
    const condition = event.tags.find((t: string[]) => t[0] === 'condition')?.[1] || 'used';
    const location = event.tags.find((t: string[]) => t[0] === 'location')?.[1] || '';
    const contact = event.tags.find((t: string[]) => t[0] === 'contact')?.[1] || '';

    // Extract user tags (exclude system tags)
    const tags = event.tags
      .filter((t: string[]) => t[0] === 't' && t[1] !== 'nostr-for-nomads-shop')
      .map((t: string[]) => t[1]);

    const media = extractMedia(event.tags);

    return {
      id: event.id,
      dTag,
      pubkey: event.pubkey,
      title,
      summary: event.content.substring(0, 200),
      description: event.content,
      price,
      currency,
      category,
      condition,
      location,
      contact,
      tags,
      media,
      createdAt: event.created_at,
      publishedAt: event.created_at,
    };
  } catch (error) {
    logger.error('Failed to parse product event', error as Error, {
      service: 'ShopService',
      method: 'parseProductEvent',
    });
    return null;
  }
}
