# Shop vs Heritage Implementation Comparison Report

**Date:** November 16, 2025  
**Comparison Scope:** 23+ files across Shop and Heritage (Contributions) implementations  
**Reference Source:** `/temp-cb-reference/` (battle-tested Culture Bridge heritage implementation)

---

## Executive Summary

**Status:** ⚠️ **SHOP IMPLEMENTATION HAS CRITICAL GAPS**

The Shop implementation is **functionally incomplete** compared to the battle-tested Heritage reference. While the **create/publish flow works**, the **edit/update flow is broken** due to missing critical functions and patterns.

### Key Findings:
- ✅ **Publishing flow:** WORKS (create + publish)
- ❌ **Update flow:** BROKEN (missing `updateProductWithAttachments()`)
- ❌ **Media metadata:** INCOMPLETE (missing `parseImetaTag()`, `createMediaItemsFromImeta()`)
- ❌ **Backward compatibility:** MISSING (`parseEventContent()`, `cleanLegacyContent()`)
- ❌ **Type helpers:** INCOMPLETE (missing exports, validators, constants)
- ❌ **Edit hook pattern:** WRONG (tight coupling, no `useContentEditing` wrapper)

### Impact:
- **Edit product page** will fail to update attachments correctly
- **Product detail page** won't show full media metadata (size, dimensions, hash)
- **Legacy events** (if any) won't parse correctly
- **Selective attachment operations** (remove specific attachments) not supported

---

## Detailed File Comparison

### 1. Types: `/src/types/shop.ts` vs `/temp-cb-reference/src/types/heritage.ts`

**STATUS:** ❌ **MAJOR DISCREPANCIES**

**Line Count:**
- Heritage: 495 lines
- Shop: 175 lines
- **Missing: ~320 lines of critical helpers**

**CRITICAL MISSING:**

#### 1.1 Validation Export
```typescript
// ❌ MISSING in shop.ts
export const validateProductData = (data: Partial<ProductData>): ProductValidationResult => {
  // Should be exported from types, not just from service
}
```

#### 1.2 Event Parser
```typescript
// ❌ MISSING in shop.ts
export const parseProductEvent = (event: NostrEvent): ProductEvent | null => {
  // Parse Nostr event into ProductEvent
  // Extract all tags, media, content
}
```

#### 1.3 Type Guards
```typescript
// ❌ MISSING in shop.ts
export const isProductEvent = (event: NostrEvent): event is ProductNostrEvent => {
  return (
    event.kind === 30023 &&
    event.tags.some(t => t[0] === 't' && t[1] === PRODUCT_SYSTEM_TAG)
  );
};
```

#### 1.4 Constants
```typescript
// ❌ MISSING in shop.ts
export const PRODUCT_TAG_KEYS = {
  D_TAG: 'd',
  SYSTEM_TAG: 't',
  TITLE: 'title',
  PRICE: 'price',
  CURRENCY: 'currency',
  CATEGORY: 'category',
  CONDITION: 'condition',
  LOCATION: 'location',
  CONTACT: 'contact',
  USER_TAG: 't',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  IMETA: 'imeta',
} as const;

export const PRODUCT_SYSTEM_TAG = 'nostr-for-nomads-shop';
```

#### 1.5 Content Parsing Helpers
```typescript
// ❌ MISSING in shop.ts
export const parseEventContent = (event: NostrEvent): { content: string } | null => {
  try {
    const content = JSON.parse(event.content);
    return content;
  } catch {
    return { content: event.content };
  }
};

export const cleanLegacyContent = (content: string, title: string): string => {
  // Remove title as H1 heading from the beginning if it exists
  const titleH1Pattern = new RegExp(`^#\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+`, 'i');
  let cleaned = content.replace(titleH1Pattern, '');
  
  // Remove embedded media section added by old event implementation
  const mediaHeaderPattern = /\n\n##\s+Media\s*\n\n(.*\n)*?(?=\n\n##|\n\n[^!\[]|$)/;
  cleaned = cleaned.replace(mediaHeaderPattern, '');
  
  return cleaned.trim();
};
```

**FIX REQUIRED:** Add all missing exports to `/src/types/shop.ts`

---

### 2. Business Service: `/src/services/business/ShopService.ts` vs `/temp-cb-reference/src/services/business/HeritageContentService.ts`

**STATUS:** ❌ **MAJOR DISCREPANCIES - CRITICAL**

**Line Count:**
- Heritage: 865 lines
- Shop: 551 lines
- **Missing: ~314 lines of critical business logic**

**CRITICAL MISSING:**

#### 2.1 Update Function (HIGHEST PRIORITY)
```typescript
// ❌ COMPLETELY MISSING in ShopService.ts
/**
 * Update an existing product with attachments
 * Follows NIP-33 pattern: fetch original → upload new → merge with selective ops → publish
 * 
 * @param productId - The d-tag ID of the product to update
 * @param updatedData - Partial product data with fields to update
 * @param attachmentFiles - New File objects to upload (NOT existing attachments)
 * @param signer - Nostr signer for signing events
 * @param onProgress - Optional callback for progress updates
 * @param selectiveOps - Optional: Explicitly specify which attachments to keep/remove
 */
export async function updateProductWithAttachments(
  productId: string,
  updatedData: Partial<ProductData>,
  attachmentFiles: File[],
  signer: NostrSigner,
  onProgress?: (progress: ProductPublishingProgress) => void,
  selectiveOps?: { removedAttachments: string[]; keptAttachments: string[] }
): Promise<UpdateProductResult> {
  try {
    onProgress?.({
      step: 'validating',
      progress: 5,
      message: 'Starting update...',
      details: 'Validating product',
    });

    // Step 1: Fetch the original product
    const originalProduct = await fetchProductById(productId);
    if (!originalProduct) {
      return {
        success: false,
        error: `Original product not found: ${productId}`,
      };
    }

    // Step 2: Upload new attachment files (if any)
    let newAttachments: Array<{
      url: string;
      type: 'image' | 'video' | 'audio';
      hash?: string;
      name: string;
      size?: number;
      mimeType?: string;
    }> = [];

    if (attachmentFiles.length > 0) {
      onProgress?.({
        step: 'uploading',
        progress: 10,
        message: 'Starting media upload...',
        details: `Uploading ${attachmentFiles.length} file(s)`,
      });

      const uploadResult = await uploadSequentialWithConsent(
        attachmentFiles,
        signer,
        (progress) => {
          const progressPercent = 10 + (progress.overallProgress * 60);
          onProgress?.({
            step: 'uploading',
            progress: progressPercent,
            message: 'Uploading attachments...',
            details: `File ${progress.currentFileIndex + 1} of ${progress.totalFiles}`,
          });
        }
      );

      if (!uploadResult.success && !uploadResult.partialSuccess) {
        return {
          success: false,
          error: `Failed to upload attachments`,
        };
      }

      newAttachments = uploadResult.uploadedFiles.map((uploaded) => {
        const file = attachmentFiles.find(f => f.name === uploaded.fileId);
        const fileType = uploaded.fileType || '';
        
        let attachmentType: 'image' | 'video' | 'audio' = 'image';
        if (fileType.startsWith('video/')) attachmentType = 'video';
        else if (fileType.startsWith('audio/')) attachmentType = 'audio';

        return {
          url: uploaded.url,
          type: attachmentType,
          hash: uploaded.hash,
          name: file?.name || uploaded.fileId,
          size: uploaded.fileSize,
          mimeType: uploaded.fileType,
        };
      });
    }

    // Step 3: Merge attachments using selective operations
    let allAttachments: Array<{
      url: string;
      type: 'image' | 'video' | 'audio';
      hash?: string;
      name: string;
      size?: number;
      mimeType?: string;
    }> = [];

    // Convert existing media to attachment format
    const existingAttachments = (originalProduct.media?.images || [])
      .map(img => ({ ...img, type: 'image' as const }))
      .concat((originalProduct.media?.videos || []).map(vid => ({ ...vid, type: 'video' as const })))
      .concat((originalProduct.media?.audio || []).map(aud => ({ ...aud, type: 'audio' as const })));

    if (selectiveOps) {
      // Selective mode: Keep only specified attachments + add new ones
      const keptUrlSet = new Set<string>();
      selectiveOps.keptAttachments.forEach(keptId => {
        const found = existingAttachments.find(att => att.url === keptId);
        if (found?.url) {
          keptUrlSet.add(found.url);
        }
      });
      
      const keptAttachments = existingAttachments.filter(att => 
        keptUrlSet.has(att.url)
      );
      allAttachments = [...keptAttachments, ...newAttachments];

      logger.info('Selective attachment merge', {
        service: 'ShopService',
        method: 'updateProductWithAttachments',
        originalCount: existingAttachments.length,
        keptCount: keptAttachments.length,
        removedCount: selectiveOps.removedAttachments.length,
        newCount: newAttachments.length,
        finalCount: allAttachments.length,
      });
    } else {
      // Legacy mode: Keep all existing + add new ones
      allAttachments = newAttachments.length > 0
        ? [...existingAttachments, ...newAttachments]
        : existingAttachments;
    }

    // Step 4: Prepare merged data
    const mergedData = {
      ...originalProduct,
      ...updatedData,
      attachments: allAttachments,
    };

    // Step 5: Check for changes (avoid unnecessary updates)
    const hasContentChanges = Object.keys(updatedData).some(key => {
      const originalValue = originalProduct[key as keyof ProductEvent];
      const newValue = mergedData[key as keyof typeof mergedData];
      return originalValue !== newValue;
    });

    const hasAttachmentChanges = newAttachments.length > 0 || (selectiveOps && selectiveOps.removedAttachments.length > 0);

    if (!hasContentChanges && !hasAttachmentChanges) {
      logger.info('No changes detected, skipping update', {
        service: 'ShopService',
        method: 'updateProductWithAttachments',
        productId,
      });

      return {
        success: true,
        product: originalProduct,
        eventId: originalProduct.id,
      };
    }

    // Step 6: Create NIP-33 replacement event (same dTag)
    onProgress?.({
      step: 'publishing',
      progress: 75,
      message: 'Creating event...',
      details: 'Preparing NIP-33 replacement event',
    });

    const event = await nostrEventService.createProductEvent(
      mergedData,
      signer,
      originalProduct.dTag // Same dTag for NIP-33 replacement
    );

    // Step 7: Publish to relays
    onProgress?.({
      step: 'publishing',
      progress: 85,
      message: 'Publishing to relays...',
      details: 'Broadcasting replacement event',
    });

    const publishResult = await nostrEventService.publishEvent(event, signer);

    if (!publishResult.success) {
      return {
        success: false,
        error: `Failed to publish to any relay: ${publishResult.error}`,
        eventId: event.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    }

    // Step 8: Parse updated product
    const media = createMediaItemsFromImeta(event);

    const updatedProduct: ProductEvent = {
      ...originalProduct,
      id: event.id,
      title: mergedData.title,
      description: mergedData.description,
      price: mergedData.price,
      currency: mergedData.currency,
      category: mergedData.category,
      condition: mergedData.condition,
      location: mergedData.location,
      contact: mergedData.contact,
      media: {
        images: media.filter(m => m.type === 'image'),
        videos: media.filter(m => m.type === 'video'),
        audio: media.filter(m => m.type === 'audio'),
      },
      tags: mergedData.tags,
      publishedAt: event.created_at,
    };

    onProgress?.({
      step: 'complete',
      progress: 100,
      message: 'Update complete!',
      details: `Published to ${publishResult.publishedRelays?.length || 0} relays`,
    });

    return {
      success: true,
      eventId: event.id,
      product: updatedProduct,
      publishedRelays: publishResult.publishedRelays,
      failedRelays: publishResult.failedRelays,
    };

  } catch (error) {
    logger.error('Failed to update product', error as Error, {
      service: 'ShopService',
      method: 'updateProductWithAttachments',
      productId,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error updating product',
    };
  }
}

export interface UpdateProductResult {
  success: boolean;
  eventId?: string;
  product?: ProductEvent;
  publishedRelays?: string[];
  failedRelays?: string[];
  error?: string;
  [key: string]: unknown;
}
```

**CRITICAL:** This function is **REQUIRED** for edit page to work properly!

#### 2.2 Imeta Parsing Functions
```typescript
// ❌ MISSING in ShopService.ts
/**
 * Parse imeta tag to extract comprehensive media metadata
 * NIP-94 format: ["imeta", "url <url>", "m <mime>", "x <hash>", "size <bytes>", "dim <WxH>", ...]
 */
function parseImetaTag(imetaTag: string[]): Partial<ContentMediaSource> | null {
  if (!imetaTag || imetaTag[0] !== 'imeta') return null;
  
  const metadata: Partial<ContentMediaSource> = {};
  
  // Join all parts (excluding first element which is 'imeta')
  const imetaStr = imetaTag.slice(1).join(' ');
  
  // Extract URL
  const urlMatch = imetaStr.match(/url\s+(\S+)/);
  if (urlMatch) metadata.url = urlMatch[1];
  
  // Extract mime type
  const mimeMatch = imetaStr.match(/m\s+(\S+)/);
  if (mimeMatch) metadata.mimeType = mimeMatch[1];
  
  // Extract hash
  const hashMatch = imetaStr.match(/x\s+(\S+)/);
  if (hashMatch) metadata.hash = hashMatch[1];
  
  // Extract size (in bytes)
  const sizeMatch = imetaStr.match(/size\s+(\d+)/);
  if (sizeMatch) metadata.size = parseInt(sizeMatch[1], 10);
  
  // Extract dimensions
  const dimMatch = imetaStr.match(/dim\s+(\d+)x(\d+)/);
  if (dimMatch) {
    metadata.dimensions = {
      width: parseInt(dimMatch[1], 10),
      height: parseInt(dimMatch[2], 10),
    };
  }
  
  return metadata;
}

/**
 * Create media items with full metadata from imeta tags
 */
function createMediaItemsFromImeta(event: { tags: string[][] }): ContentMediaItem[] {
  const mediaItems: ContentMediaItem[] = [];
  
  // Find all media tags (image, video, audio) and their corresponding imeta tags
  event.tags.forEach(tag => {
    const tagType = tag[0];
    const isMediaTag = (tagType === 'image' || tagType === 'video' || tagType === 'audio') && tag[1];
    
    if (isMediaTag) {
      const url = tag[1];
      
      // Find corresponding imeta tag
      const imetaTag = event.tags.find(
        t => t[0] === 'imeta' && t.some(part => part.includes(url))
      );
      
      let metadata: Partial<ContentMediaSource> = {
        url,
        name: `Media ${mediaItems.length + 1}`,
      };
      
      // If imeta tag exists, parse it for full metadata
      if (imetaTag) {
        const parsedMeta = parseImetaTag(imetaTag);
        if (parsedMeta) {
          metadata = { ...metadata, ...parsedMeta };
        }
      }
      
      // Infer mime type from URL or tag type if not provided
      if (!metadata.mimeType) {
        if (tagType === 'video' || url.match(/\.(mp4|webm|mov)$/i)) {
          metadata.mimeType = 'video/mp4';
        } else if (tagType === 'audio' || url.match(/\.(mp3|wav|ogg)$/i)) {
          metadata.mimeType = 'audio/mpeg';
        } else {
          metadata.mimeType = 'image/jpeg';
        }
      }
      
      // Determine media type from tag type or mime type
      let type: ContentMediaType = 'image';
      if (tagType === 'video' || metadata.mimeType?.startsWith('video/')) {
        type = 'video';
      } else if (tagType === 'audio' || metadata.mimeType?.startsWith('audio/')) {
        type = 'audio';
      }
      
      mediaItems.push({
        id: metadata.hash || `media-${mediaItems.length}`,
        type,
        source: metadata as ContentMediaSource,
      });
    }
  });
  
  return mediaItems;
}
```

#### 2.3 Content Parsing Helpers
```typescript
// ❌ MISSING in ShopService.ts
function parseEventContent(event: NostrEvent): { content: string } | null {
  try {
    const content = JSON.parse(event.content);
    return content;
  } catch {
    return { content: event.content };
  }
}

function cleanLegacyContent(content: string, title: string): string {
  // Remove title as H1 heading from the beginning if it exists
  const titleH1Pattern = new RegExp(`^#\\s+${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n+`, 'i');
  let cleaned = content.replace(titleH1Pattern, '');
  
  // Also remove if title appears at the very start without the H1 marker
  if (cleaned.startsWith(`${title}\n`)) {
    cleaned = cleaned.substring(title.length + 1).trimStart();
  }
  
  // Remove embedded media section added by old implementation
  const mediaHeaderPattern = /\n\n##\s+Media\s*\n\n(.*\n)*?(?=\n\n##|\n\n[^!\[]|$)/;
  cleaned = cleaned.replace(mediaHeaderPattern, '');
  
  // Also handle case where ## Media section is at the end of content
  const mediaHeaderAtEndPattern = /\n\n##\s+Media\s*\n\n[\s\S]*$/;
  cleaned = cleaned.replace(mediaHeaderAtEndPattern, '');
  
  return cleaned.trim();
}
```

**FIX REQUIRED:** Add all missing functions to `/src/services/business/ShopService.ts`

---

### 3. Edit Hook: `/src/hooks/useProductEditing.ts` vs `/temp-cb-reference/src/hooks/useHeritageEditing.ts`

**STATUS:** ❌ **WRONG PATTERN - CRITICAL**

**Current Problem:**
- Shop's `useProductEditing` is **tightly coupled** to `useMyShopStore`
- Does NOT use generic `useContentEditing` wrapper
- Does NOT support `selectiveOps` (selective attachment removal)
- Uses `createProduct()` with `existingDTag` parameter for updates (wrong pattern)

**Heritage Pattern:**
```typescript
// temp-cb-reference/src/hooks/useHeritageEditing.ts (41 lines)
import { useContentEditing } from './useContentEditing';
import { updateHeritageWithAttachments } from '@/services/business/HeritageContentService';
import type { SimpleUpdateFunction } from '@/types/content-publishing';
import type { HeritageContributionData, UpdateHeritageResult, HeritagePublishingProgress } from '@/types/heritage';

export function useHeritageEditing() {
  const updateFn: SimpleUpdateFunction<HeritageContributionData, UpdateHeritageResult, HeritagePublishingProgress> = async (
    contentId,
    updatedData,
    attachmentFiles,
    signer,
    onProgress,
    selectiveOps
  ) => {
    return await updateHeritageWithAttachments(
      contentId,
      updatedData,
      attachmentFiles,
      signer,
      onProgress,
      selectiveOps
    );
  };

  return useContentEditing('useHeritageEditing', updateFn, false);
}
```

**FIX REQUIRED:** Refactor `/src/hooks/useProductEditing.ts` to match Heritage pattern:

```typescript
// src/hooks/useProductEditing.ts (REFACTORED)
import { useContentEditing } from './useContentEditing';
import { updateProductWithAttachments } from '@/services/business/ShopService';
import type { SimpleUpdateFunction } from '@/types/content-publishing';
import type { ProductData, UpdateProductResult, ProductPublishingProgress } from '@/types/shop';

/**
 * Hook for editing existing products
 * Uses generic useContentEditing wrapper for consistent edit flows
 */
export function useProductEditing() {
  const updateFn: SimpleUpdateFunction<ProductData, UpdateProductResult, ProductPublishingProgress> = async (
    contentId,
    updatedData,
    attachmentFiles,
    signer,
    onProgress,
    selectiveOps
  ) => {
    return await updateProductWithAttachments(
      contentId,
      updatedData,
      attachmentFiles,
      signer,
      onProgress,
      selectiveOps
    );
  };

  return useContentEditing('useProductEditing', updateFn, false);
}
```

**Benefits:**
- Decouples from store (cleaner architecture)
- Supports selective attachment operations
- Uses dedicated `updateProductWithAttachments()` function
- Follows battle-tested Heritage pattern

---

### 4. Generic Service: `/src/services/generic/GenericShopService.ts` vs `/temp-cb-reference/src/services/generic/GenericHeritageService.ts`

**STATUS:** ✅ **SHOP IS BETTER!**

**Surprising Finding:**
Shop's `GenericShopService.ts` actually has **MORE comprehensive imeta parsing** than Heritage reference at the protocol layer!

**Shop's `parseImetaTag()`:**
```typescript
// Extracts: url, mimeType, hash, size (4 fields)
```

**Heritage's `parseImetaTag()`:**
```typescript
// Extracts: url, mimeType (2 fields only)
```

**Recommendation:** Keep Shop's implementation. Consider backporting to Heritage reference.

---

### 5. Other Files

#### ✅ Config: Match appropriate to domain
- Heritage: Complex enums (HeritageType, TimePeriod, SourceType)
- Shop: Simple arrays (categories, conditions, currencies)
- **Both correct for their domains**

#### ✅ Stores: Shop is better
- Shop has `reset()` method
- Shop adds to beginning (newest first)
- Heritage adds to end (oldest first)

#### ✅ Publishing Hook: Both match
- Both use `useContentPublishing` generic wrapper
- Both handle progress, state, consent

#### ⚠️ Public Products Hook: Heritage has more features
- Heritage: search, category filter, sorting
- Shop: pagination only
- **Consider adding filters to Shop**

---

## Priority Action Plan

### **PHASE 1: CRITICAL FIXES (BLOCKING PRODUCTION)**

These fixes are **REQUIRED** before Shop can be used in production:

#### 1.1 Implement `updateProductWithAttachments()` in ShopService
**File:** `/src/services/business/ShopService.ts`  
**Priority:** 🔴 **CRITICAL**  
**Effort:** 4-6 hours  
**Pattern:** Copy from Heritage's `updateHeritageWithAttachments()` (see code above)

#### 1.2 Refactor `useProductEditing` Hook
**File:** `/src/hooks/useProductEditing.ts`  
**Priority:** 🔴 **CRITICAL**  
**Effort:** 1 hour  
**Pattern:** Use `useContentEditing` wrapper (see code above)

#### 1.3 Add Imeta Parsing Functions to ShopService
**Files:** `/src/services/business/ShopService.ts`  
**Priority:** 🔴 **CRITICAL**  
**Effort:** 2 hours  
**Functions:** `parseImetaTag()`, `createMediaItemsFromImeta()`

#### 1.4 Add Content Parsing Helpers to ShopService
**Files:** `/src/services/business/ShopService.ts`  
**Priority:** 🟡 **HIGH**  
**Effort:** 1 hour  
**Functions:** `parseEventContent()`, `cleanLegacyContent()`

#### 1.5 Expand `/src/types/shop.ts` with Helpers
**File:** `/src/types/shop.ts`  
**Priority:** 🟡 **HIGH**  
**Effort:** 2 hours  
**Exports:** `parseProductEvent()`, `validateProductData()`, `isProductEvent()`, `PRODUCT_TAG_KEYS`, `PRODUCT_SYSTEM_TAG`

**TOTAL EFFORT:** 10-12 hours

---

### **PHASE 2: ENHANCEMENTS (RECOMMENDED)**

#### 2.1 Add Search/Filter to `usePublicProducts`
**File:** `/src/hooks/usePublicProducts.ts`  
**Priority:** 🟡 **MEDIUM**  
**Effort:** 3 hours  
**Features:** Search by title, category filter, price filter, sort options

#### 2.2 Add Relay Progress Tracking to `useMyShopProducts`
**File:** `/src/hooks/useMyShopProducts.ts`  
**Priority:** 🟢 **LOW**  
**Effort:** 1 hour  
**Feature:** Show relay connection status during fetch

#### 2.3 Verify Components Use Full Metadata
**Files:** ProductDetail, ProductCard, MyProductCard  
**Priority:** 🟡 **MEDIUM**  
**Effort:** 2 hours  
**Check:** Ensure components render media with size, dimensions, hash

**TOTAL EFFORT:** 6 hours

---

### **PHASE 3: TESTING & VALIDATION**

#### 3.1 Test Update Flow
- Create product → Edit → Verify attachments preserved
- Create product → Edit → Add new attachments → Verify merge
- Create product → Edit → Remove attachments → Verify selective removal

#### 3.2 Test Media Metadata
- Upload product with images → Verify imeta tags created
- Fetch product → Verify full metadata displayed (size, dimensions, hash)
- Edit product → Verify media metadata preserved

#### 3.3 Test Backward Compatibility
- Create legacy event (with title in content) → Verify cleanLegacyContent works
- Create event with old media format → Verify parsing works

---

## Summary: Critical Gaps

| Component | Missing Feature | Impact | Priority |
|-----------|----------------|--------|----------|
| **ShopService** | `updateProductWithAttachments()` | ❌ Edit broken | 🔴 CRITICAL |
| **ShopService** | `parseImetaTag()`, `createMediaItemsFromImeta()` | ⚠️ No media metadata | 🔴 CRITICAL |
| **useProductEditing** | Generic wrapper pattern | ⚠️ Tight coupling | 🔴 CRITICAL |
| **shop.ts types** | Helper exports | ⚠️ No validation/parsing | 🟡 HIGH |
| **ShopService** | `parseEventContent()`, `cleanLegacyContent()` | ⚠️ No legacy support | 🟡 HIGH |
| **usePublicProducts** | Search/filter | ℹ️ Limited UX | 🟡 MEDIUM |

---

## Recommendations

### For Production Deployment:
1. ✅ **Complete Phase 1 before deploying** (10-12 hours)
2. ✅ Test update flow comprehensively
3. ⚠️ Consider Phase 2 enhancements for better UX

### For Code Quality:
1. Add TypeScript strict mode compliance
2. Add unit tests for update flow
3. Add integration tests for media handling
4. Document selective operations pattern

### For Future:
1. Consider extracting more generic patterns (Shop + Heritage share 80% of logic)
2. Create base ContentService class
3. Unify media handling across all content types

---

## Conclusion

The Shop implementation is **80% complete** but has **critical gaps in the update/edit flow**. The publish flow works well, but editing will fail due to:

1. Missing `updateProductWithAttachments()` function
2. Wrong edit hook pattern (tight coupling)
3. Incomplete media metadata parsing
4. Missing backward compatibility helpers

**Estimated Fix Time:** 10-12 hours for Phase 1 (critical fixes)

After Phase 1 completion, Shop will be **production-ready** with full CRUD capabilities matching the battle-tested Heritage implementation.
