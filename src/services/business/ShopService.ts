import { logger } from '@/services/core/LoggingService';
import type { ProductData, ProductPublishingProgress, ProductEvent, ProductExploreItem, UpdateProductResult } from '@/types/shop';
import { validateProductData } from './ProductValidationService';
import { nostrEventService } from '../nostr/NostrEventService';
import type { NostrSigner, NostrEvent, NIP23Event } from '@/types/nostr';
import { uploadSequentialWithConsent } from '@/services/generic/GenericBlossomService';
import { fetchPublicProducts as fetchPublicProductsFromRelay, extractMedia } from '@/services/generic/GenericShopService';
import { queryEvents } from '@/services/generic/GenericRelayService';
import { createDeletionEvent, signEvent } from '@/services/generic/GenericEventService';

export interface RelayProgress {
  step: string;
  progress: number;
  message: string;
}

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
 * Update an existing product with attachments (edit flow)
 * Business layer method for updating products with selective attachment operations
 * 
 * @param productId - Product's dTag identifier
 * @param updatedProductData - Updated product metadata
 * @param newAttachmentFiles - New files to attach (optional)
 * @param signer - Nostr signer for signing events and uploads
 * @param selectiveOps - Selective operations for existing attachments (optional)
 * @param onProgress - Progress callback (optional)
 * @returns Result with success status, event ID, and relay info
 */
export async function updateProductWithAttachments(
  productId: string,
  updatedProductData: ProductData,
  newAttachmentFiles: File[],
  signer: NostrSigner,
  selectiveOps?: { keep?: string[]; remove?: string[] },
  onProgress?: (progress: ProductPublishingProgress) => void
): Promise<UpdateProductResult> {
  try {
    logger.info('Updating product with attachments', {
      service: 'ShopService',
      method: 'updateProductWithAttachments',
      productId,
      newFilesCount: newAttachmentFiles.length,
      selectiveOps,
    });

    onProgress?.({
      step: 'validating',
      progress: 5,
      message: 'Fetching original product...',
    });

    // Step 1: Fetch original product
    const originalProduct = await fetchProductById(productId);
    if (!originalProduct) {
      return {
        success: false,
        error: 'Product not found',
      };
    }

    onProgress?.({
      step: 'uploading',
      progress: 10,
      message: 'Processing attachments...',
    });

    // Step 2: Handle existing attachments with selective operations
    // Extract all media URLs from the original product's structured media object
    const originalMediaUrls: string[] = [
      ...originalProduct.media.images.map(img => img.url),
      ...originalProduct.media.videos.map(vid => vid.url),
      ...originalProduct.media.audio.map(aud => aud.url),
    ];

    let retainedMediaUrls: string[] = [];
    if (originalMediaUrls.length > 0) {
      if (selectiveOps?.keep) {
        // Keep only specified attachments
        retainedMediaUrls = originalMediaUrls.filter(url =>
          selectiveOps.keep!.includes(url)
        );
      } else if (selectiveOps?.remove) {
        // Remove specified attachments
        retainedMediaUrls = originalMediaUrls.filter(
          url => !selectiveOps.remove!.includes(url)
        );
      } else {
        // Keep all existing attachments by default
        retainedMediaUrls = [...originalMediaUrls];
      }
    }

    // Step 3: Upload new attachment files (if any)
    const uploadedAttachments: Array<{
      type: 'image' | 'video' | 'audio';
      url: string;
      hash: string;
      name: string;
      id: string;
      size: number;
      mimeType: string;
    }> = [];

    if (newAttachmentFiles && newAttachmentFiles.length > 0) {
      onProgress?.({
        step: 'uploading',
        progress: 15,
        message: `Uploading ${newAttachmentFiles.length} new attachment(s)...`,
      });

      const uploadResult = await uploadSequentialWithConsent(
        newAttachmentFiles,
        signer,
        (uploadProgress) => {
          // Map upload progress (0-1) to publishing progress (15% to 70%)
          const mappedProgress = 15 + (55 * uploadProgress.overallProgress);
          onProgress?.({
            step: 'uploading',
            progress: mappedProgress,
            message: uploadProgress.nextAction,
            details: `File ${uploadProgress.currentFileIndex + 1} of ${uploadProgress.totalFiles}`,
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

      if (uploadResult.successCount === 0 && newAttachmentFiles.length > 0) {
        return {
          success: false,
          error: 'All media uploads failed',
        };
      }

      // Map uploaded files to attachment format (matching Shop's createProduct pattern)
      for (let i = 0; i < uploadResult.uploadedFiles.length; i++) {
        const uploadedFile = uploadResult.uploadedFiles[i];
        const originalFile = newAttachmentFiles[i];
        
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
        method: 'updateProductWithAttachments',
        uploadedCount: uploadedAttachments.length,
      });
    }

    // Step 4: Merge attachments - combine retained URLs as attachments + new uploads
    // Convert retained URLs back to attachment format (preserve type info)
    const retainedAttachments = [
      ...originalProduct.media.images.filter(img => retainedMediaUrls.includes(img.url)).map(img => ({
        type: 'image' as const,
        url: img.url,
        hash: img.hash || '',
        name: '', // Original name not stored
        id: `${img.hash}-retained`,
        size: img.size || 0,
        mimeType: img.mimeType || 'image/jpeg',
      })),
      ...originalProduct.media.videos.filter(vid => retainedMediaUrls.includes(vid.url)).map(vid => ({
        type: 'video' as const,
        url: vid.url,
        hash: vid.hash || '',
        name: '',
        id: `${vid.hash}-retained`,
        size: vid.size || 0,
        mimeType: vid.mimeType || 'video/mp4',
      })),
      ...originalProduct.media.audio.filter(aud => retainedMediaUrls.includes(aud.url)).map(aud => ({
        type: 'audio' as const,
        url: aud.url,
        hash: aud.hash || '',
        name: '',
        id: `${aud.hash}-retained`,
        size: aud.size || 0,
        mimeType: aud.mimeType || 'audio/mpeg',
      })),
    ];

    const mergedAttachments = [...retainedAttachments, ...uploadedAttachments];

    onProgress?.({
      step: 'publishing',
      progress: 75,
      message: 'Creating updated product event...',
    });

    // Step 5: Check for changes
    const hasContentChanges =
      updatedProductData.title !== originalProduct.title ||
      updatedProductData.description !== originalProduct.description ||
      updatedProductData.price !== originalProduct.price ||
      updatedProductData.condition !== originalProduct.condition ||
      updatedProductData.category !== originalProduct.category ||
      updatedProductData.currency !== originalProduct.currency ||
      updatedProductData.location !== originalProduct.location ||
      updatedProductData.contact !== originalProduct.contact ||
      JSON.stringify(updatedProductData.tags) !== JSON.stringify(originalProduct.tags);

    const hasAttachmentChanges =
      mergedAttachments.length !== originalMediaUrls.length ||
      mergedAttachments.some(
        (item, index) => item.url !== originalMediaUrls[index]
      );

    if (!hasContentChanges && !hasAttachmentChanges) {
      logger.info('No changes detected, skipping update', {
        service: 'ShopService',
        method: 'updateProductWithAttachments',
        productId,
      });

      onProgress?.({
        step: 'complete',
        progress: 100,
        message: 'No changes detected',
      });

      return {
        success: true,
        eventId: originalProduct.id,
        product: originalProduct,
      };
    }

    // Step 6: Create product event with merged attachments (using existing createProduct pattern)
    const productDataWithAttachments: ProductData = {
      ...updatedProductData,
      attachments: mergedAttachments,
    };

    logger.info('Creating updated product event', {
      service: 'ShopService',
      method: 'updateProductWithAttachments',
      existingDTag: productId,
    });

    const event = await nostrEventService.createProductEvent(
      productDataWithAttachments,
      signer,
      productId // Pass existing dTag for NIP-33 replacement
    );

    // Extract dTag before publishing
    const dTag = event.tags.find(tag => tag[0] === 'd')?.[1];
    if (!dTag) {
      throw new Error('Created event missing required d tag');
    }

    onProgress?.({
      step: 'publishing',
      progress: 85,
      message: 'Publishing updated product...',
    });

    // Step 7: Publish to relays
    logger.info('Publishing updated product event to relays', {
      service: 'ShopService',
      method: 'updateProductWithAttachments',
      eventId: event.id,
      dTag,
    });

    const publishResult = await nostrEventService.publishEvent(
      event,
      signer
    );

    if (!publishResult.success) {
      logger.error('Failed to publish updated event', new Error(publishResult.error), {
        service: 'ShopService',
        method: 'updateProductWithAttachments',
        productId,
      });

      onProgress?.({
        step: 'complete',
        progress: 0,
        message: 'Publishing failed',
        details: publishResult.error,
      });

      return {
        success: false,
        error: publishResult.error,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Product updated successfully',
    });

    // Step 8: Parse and return updated product (query back from relay to get full parsed event)
    const updatedProduct = await fetchProductById(productId);

    logger.info('Product updated successfully', {
      service: 'ShopService',
      method: 'updateProductWithAttachments',
      eventId: publishResult.eventId,
      publishedRelays: publishResult.publishedRelays?.length,
    });

    return {
      success: true,
      eventId: publishResult.eventId,
      product: updatedProduct || undefined,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Product update failed', error as Error, {
      service: 'ShopService',
      method: 'updateProductWithAttachments',
      productId,
    });
    
    onProgress?.({
      step: 'complete',
      progress: 0,
      message: 'Update failed',
      details: errorMessage,
    });
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Fetch public products for browse/listing view
 * Business layer method that orchestrates fetching and data transformation
 * 
 * @param limit - Maximum number of products to fetch
 * @param until - Optional timestamp for pagination
 * @param onProgress - Optional callback for relay query progress
 * @returns Array of product explore items ready for display
 */
export async function fetchPublicProducts(
  limit: number = 20,
  until?: number,
  onProgress?: (progress: RelayProgress) => void
): Promise<ProductExploreItem[]> {
  try {
    logger.info('Fetching public products', {
      service: 'ShopService',
      method: 'fetchPublicProducts',
      limit,
      until,
    });

    const products = await fetchPublicProductsFromRelay(limit, until, onProgress);
    
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
 * Parse NIP-23 event content safely
 * Handles both JSON-stringified content and plain text
 * 
 * @param event - Nostr event with content field
 * @returns Parsed content object or fallback with raw content
 */
function parseEventContent(event: NostrEvent): { content: string } | null {
  try {
    // Try parsing as NIP-23 event (JSON content)
    const parsedContent = nostrEventService.parseEventContent(event as NIP23Event);
    if (parsedContent) {
      return { content: parsedContent.content || event.content };
    }
    
    // Fallback to raw content if parsing fails
    return { content: event.content };
  } catch {
    // If all else fails, return raw content
    return { content: event.content };
  }
}

/**
 * Clean legacy content that may have title embedded as H1 heading
 * Provides backward compatibility with events created before content standardization
 * 
 * @param content - Raw content string from event
 * @param title - Product title to remove if embedded
 * @returns Cleaned content without redundant title or media sections
 */
function cleanLegacyContent(content: string, title: string): string {
  if (!content || !title) return content;
  
  // Remove title as H1 heading from the beginning if it exists
  // Escape special regex characters in title
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const titleH1Pattern = new RegExp(`^#\\s+${escapedTitle}\\s*\\n+`, 'i');
  let cleaned = content.replace(titleH1Pattern, '');
  
  // Also remove if title appears at the very start without the H1 marker
  if (cleaned.startsWith(`${title}\n`)) {
    cleaned = cleaned.substring(title.length + 1).trimStart();
  }
  
  // Remove embedded media section added by old implementations
  // Pattern: ## Media header followed by content until next section or end
  const mediaHeaderPattern = /\n\n##\s+Media\s*\n\n(.*\n)*?(?=\n\n##|\n\n[^!\[]|$)/;
  cleaned = cleaned.replace(mediaHeaderPattern, '');
  
  // Also handle case where ## Media section is at the end of content
  const mediaHeaderAtEndPattern = /\n\n##\s+Media\s*\n\n[\s\S]*$/;
  cleaned = cleaned.replace(mediaHeaderAtEndPattern, '');
  
  return cleaned.trim();
}

/**
 * Parse a Nostr event into a ProductEvent
 * Helper function for transforming relay events with content parsing
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

    // Parse content using helper (handles JSON and plain text)
    const parsedContent = parseEventContent(event);
    const rawDescription = parsedContent?.content || event.content;
    
    // Clean legacy content (removes embedded title/media sections for backward compatibility)
    const description = cleanLegacyContent(rawDescription, title);

    return {
      id: event.id,
      dTag,
      pubkey: event.pubkey,
      title,
      summary: description.substring(0, 200),
      description,
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
