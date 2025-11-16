# Shop Feature - Implementation Plan

**Goal**: Implement complete CRUD cycle for marketplace products (Create ✅, Read ✅, Update ✅, Delete ✅)

**Strategy**: Leverage existing product event service + adapt My Contributions pattern

**Validation Status**: ✅ **CRITICAL VALIDATION COMPLETE** - Service layer ready, UI needs Nostr integration

---

## ⚠️ VALIDATION RESULTS - INFRASTRUCTURE AUDIT

### ✅ Existing Infrastructure (Service Layer Complete)

**NostrEventService.ts** - Product Event Creation:
- ✅ `createProductEvent(productData, signer, dTag?)` - **EXISTS** at lines 47-170
- ✅ Creates Kind 30023 parameterized replaceable events
- ✅ Supports multiple attachments (ProductAttachment[])
- ✅ Uses `nostr-for-nomads-shop` tag (updated from legacy `culture-bridge-shop`)
- ✅ Product-specific tags: price, currency, category, condition, contact
- ✅ Uses `GenericEventService.createNIP23Event()` (SOA compliant)
- ✅ Returns signed NIP23Event

**GenericEventService.ts** - Core Infrastructure:
- ✅ `createNIP23Event()` - Generic long-form event builder
- ✅ `createDeletionEvent()` - NIP-09 deletion support
- ✅ `signEvent()` - Event signing

**GenericRelayService.ts** - Query/Publish:
- ✅ `queryEvents(filters)` - Multi-relay queries
- ✅ `publishEvent(event, signer)` - Multi-relay publishing

**Tag System**:
- ✅ Discovery tag: `nostr-for-nomads-shop` (updated from legacy `culture-bridge-shop`)
- ✅ Filter ready: `/src/utils/tagFilter.ts` includes `nostr-for-nomads-shop`

### ❌ Missing Implementation (UI Layer)

**Service Methods** (Need to create):
- ❌ `ShopService.fetchProductsByAuthor(pubkey)` - User's products
- ❌ `ShopService.fetchPublicProducts(limit, until?)` - Browse products
- ❌ `ShopService.fetchProductById(dTag)` - Single product for edit
- ❌ `ShopService.deleteProduct(eventId, signer, pubkey, title)` - NIP-09 deletion
- ❌ `ShopService.createProduct()` - Wrapper for NostrEventService

**Type Definitions** (Need to create):
- ❌ `ProductData` interface (form data)
- ❌ `ProductEvent` interface (Nostr event)
- ❌ `ProductCardData` interface (display data)
- ❌ `ProductPublishingResult` interface
- ❌ `ProductPublishingState` interface
- ❌ `ProductPublishingProgress` interface

**Components** (Need to create):
- ❌ `MyProductCard.tsx` - Product card for My Shop dashboard
- ❌ `DeleteConfirmationModal.tsx` - **EXISTS in generic/** (reuse from contributions)
- ❌ `ProductForm.tsx` - Create/edit product form
- ❌ `ShopContent.tsx` - Browse products page

**Pages** (Need to create):
- ❌ `/app/shop/page.tsx` - **EXISTS but mock data** (needs Nostr integration)
- ❌ `/app/my-shop/page.tsx` - My products dashboard
- ❌ `/app/my-shop/create/page.tsx` - Create product page
- ❌ `/app/my-shop/edit/[id]/page.tsx` - Edit product page
- ❌ `/app/shop/[id]/page.tsx` - Product detail page

**Hooks** (Need to create):
- ❌ `useShopPublishing.ts` - Product publishing logic
- ❌ `useProductEditing.ts` - Product editing logic
- ❌ `usePublicProducts.ts` - Browse products logic

**Navigation**:
- ⚠️ `/shop` link exists in Header.tsx (but needs auth-gated My Shop link)

### 📋 Existing Resources We Can Reuse

**From My Contributions Pattern:**
1. **Dashboard Structure** - Copy `MyContributionsPage.tsx` → `MyShopPage.tsx`
2. **Card Component** - Adapt `MyContributionCard.tsx` → `MyProductCard.tsx`
3. **Delete Modal** - Reuse `DeleteConfirmationModal.tsx` (already generic)
4. **Service Pattern** - Copy `ContributionService.ts` → `ShopService.ts`
5. **Query Pattern** - Adapt `fetchContributionsByAuthor()` → `fetchProductsByAuthor()`
6. **Hooks Pattern** - Adapt contribution hooks → product hooks

**Service Layer Ready:**
- ✅ `NostrEventService.createProductEvent()` - Production-ready
- ✅ `GenericEventService` - NIP-09 deletion, signing, validation
- ✅ `GenericRelayService` - Multi-relay operations
- ✅ `GenericBlossomService` - Media uploads

---

## 👤 USER-FACING CHANGES - What Users Will See

### Current State (Before Implementation)
**Existing Page:**
- `/shop` - Public shop page with **MOCK DATA** (hardcoded sample products)
- Header navigation has "Shop" link visible to all users
- **NO** "My Shop" link in navigation
- **NO** ability to create/edit/delete products
- **NO** connection to Nostr relays

### Final State (After Implementation)

#### 🌍 Public Pages (All Users - No Auth Required)

**1. Browse Shop - `/shop`**
- **STATUS**: Page EXISTS, needs Nostr integration (replace mock data)
- **What Users See**: 
  - All products from Nostr relays (Kind 30023 events with `#t` = `nostr-for-nomads-shop`)
  - **Search bar**: Search by product name/description (real-time filtering)
  - **Filter panel**:
    - Category filter (Art, Services, Hardware, Software, etc.)
    - Condition filter (New, Used, Refurbished)
    - Price range slider (min/max)
  - **Sort options**: Newest first, Price low-high, Price high-low
  - **View toggle**: Grid view (default) or List view
  - **Product cards** showing: thumbnail image, title, price + currency badge, category, condition, seller name
  - **Pagination**: "Load More" button for infinite scroll
  - **Loading state**: Skeleton cards while querying relays
  - **Error state**: "Failed to load products" with retry button
  - **Empty state**: "No products found" when no results
- **Actions**: 
  - Click product card → Navigate to `/shop/[id]` (detail page)
  - Contact seller button → Opens `/messages` with seller's npub

**2. Product Detail - `/shop/[id]`**
- **STATUS**: NEW PAGE (create from scratch)
- **What Users See**:
  - **Full product details**:
    - Title and description (rich text rendered)
    - Price with currency badge (₿ BTC, sats, $ USD)
    - Category and condition badges
    - Location (where product ships from)
    - Contact method (npub, email, or custom)
    - Tags (clickable, filter by tag)
  - **Media gallery**: Multiple product images/videos from Blossom CDN with lightbox viewer
  - **Seller profile section**:
    - Seller avatar and display name
    - Seller npub (truncated with copy button)
    - "View Seller's Shop" link
  - **Product metadata**: Created date, last updated, dTag (event ID)
  - **Loading state**: Skeleton layout while fetching
  - **Error state**: "Product not found" or "Failed to load"
- **Actions**:
  - "Contact Seller" button → Opens `/messages` with pre-filled message to seller's npub
  - Click seller name → Navigate to `/shop?seller=[npub]` (filter by seller)
  - Click tag → Navigate to `/shop?tag=[tag]` (filter by tag)
  - Share button → Copy product URL to clipboard

#### 🔐 Authenticated Pages (Users Must Be Signed In)

**3. My Shop Dashboard - `/my-shop`**
- **STATUS**: NEW PAGE (create from scratch)
- **What Users See**:
  - List of their own products (only products they created)
  - **Statistics dashboard**:
    - Total products count
    - Active listings count
    - Products by category breakdown
    - Products by condition breakdown
    - Total value of all listings
  - **Filter panel**: Search by name, filter by category/condition/price range
  - **View toggle**: Grid view or List view
  - Product cards showing: image, title, price, category, condition, Edit/Delete buttons
  - **Empty state**: "Create your first product" button if no products exist
  - **Loading state**: Skeleton cards while fetching from relays
  - **Error state**: "Failed to load products" with retry button
- **Actions**:
  - "Create Product" button (top right) → Navigate to `/my-shop/create`
  - "Edit" button on each product → Navigate to `/my-shop/edit/[id]`
  - "Delete" button → Opens confirmation modal → Publishes NIP-09 deletion event

**4. Create Product - `/my-shop/create`**
- **STATUS**: NEW PAGE (create from scratch)
- **What Users See**:
  - Product form with fields:
    - **Title** (required, 5-100 characters)
    - **Description** (TipTap rich text editor, required, 20-5000 characters)
    - **Price** (number input, required, > 0)
    - **Currency** dropdown (BTC, sats, USD)
    - **Category** dropdown (Art & Collectibles, Services, Hardware, Software, Education, Fashion, Food & Drink, Home & Garden, Sports & Outdoors, Other)
    - **Condition** dropdown (New, Used, Refurbished)
    - **Location** (text input, required, 3-100 characters) - where product is located/shipped from
    - **Contact** method (defaults to npub, can customize with email/phone/other)
    - **Tags** (optional keywords, max 20 tags)
    - **Image uploads** (up to 10 images via Blossom, max 100MB per file)
  - Real-time validation with error messages
  - Image preview thumbnails with remove option
- **Actions**:
  - "Publish Product" → Creates Kind 30023 event → Navigate to `/my-shop`
  - "Cancel" → Navigate back to `/my-shop`

**5. Edit Product - `/my-shop/edit/[id]`**
- **STATUS**: NEW PAGE (create from scratch)
- **What Users See**:
  - Same form as Create, pre-filled with existing product data
  - Shows current images (can add/remove)
  - Ownership verification (only edit your own products)
- **Actions**:
  - "Update Product" → Updates Kind 30023 event (same dTag) → Navigate to `/my-shop`
  - "Cancel" → Navigate back to `/my-shop`

#### 🧭 Navigation Changes

**Header.tsx Updates:**
- **Desktop Navigation** (top bar):
  - "Shop" link remains (public, visible to all)
  - **NEW**: "My Shop" link appears ONLY when authenticated (after "Shop")
  
- **Mobile Menu** (hamburger):
  - "Shop" in public section
  - **NEW**: "My Shop" in authenticated section (with lock icon)

**Visual Example:**
```
BEFORE (Current):
[Logo] [Explore] [Contribute] [Shop] [Messages] [Profile] [Sign In]

AFTER (Authenticated User):
[Logo] [Explore] [Contribute] [Shop] [My Shop] [Messages] [Profile] [Jack ▼]

AFTER (Anonymous User):
[Logo] [Explore] [Contribute] [Shop] [Sign In]
```

### Page Replacement Summary

| Page Path | Status | Change | What Happens |
|-----------|--------|--------|--------------|
| `/shop` | **MODIFIED** | Replace mock data with Nostr queries | Existing page gets real data from relays |
| `/shop/[id]` | **NEW** | Create product detail page | New page for viewing product details |
| `/my-shop` | **NEW** | Create dashboard page | New auth-gated page for managing own products |
| `/my-shop/create` | **NEW** | Create product form page | New page for creating products |
| `/my-shop/edit/[id]` | **NEW** | Create edit form page | New page for editing own products |
| `Header.tsx` | **MODIFIED** | Add "My Shop" link (auth-gated) | Existing component gets one new navigation link |

### User Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User Lands on Site                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Header Nav     │
                    │  [Shop]         │
                    └─────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                   /shop (Public Browse)                       │
│  • View all products from Nostr relays                       │
│  • Search, filter, sort products                             │
│  • NO AUTH REQUIRED                                          │
└──────────────────────────────────────────────────────────────┘
                    │                    │
          Click Product               Sign In
                    │                    │
                    ▼                    ▼
          ┌─────────────────┐  ┌──────────────────┐
          │ /shop/[id]      │  │ Header Nav       │
          │ Product Detail  │  │ [Shop] [My Shop] │
          │                 │  └──────────────────┘
          │ • Full details  │            │
          │ • Images        │            ▼
          │ • Contact       │  ┌──────────────────────────┐
          └─────────────────┘  │   /my-shop (Dashboard)   │
                                │ • List own products      │
                                │ • Create/Edit/Delete     │
                                │ • AUTH REQUIRED          │
                                └──────────────────────────┘
                                    │            │
                            ┌───────┴────────┐   │
                            ▼                ▼   ▼
                  ┌─────────────────┐  ┌────────────────┐
                  │ /my-shop/create │  │ /my-shop/edit/ │
                  │ Create Product  │  │ Edit Product   │
                  └─────────────────┘  └────────────────┘
```

---

## 🛡️ SOA COMPLIANCE GUARANTEES

### Architectural Rules Enforcement

**Service Layer Separation (NON-NEGOTIABLE):**
```text
✅ CORRECT FLOW:
Page → Component → Hook → Business Service → Event Service → Generic Service

❌ FORBIDDEN:
Hook → Manual event building
Component → Direct relay calls
Page → Bypassing business logic
```

**Implementation Validation Checklist:**

**Phase 1 - Service Layer:**
- ✅ All methods in `ShopService.ts` (Business Layer)
- ✅ Use `NostrEventService.createProductEvent()` for product events
- ✅ Use `GenericEventService.createDeletionEvent()` for deletions
- ✅ Use `GenericRelayService.queryEvents()` for queries
- ✅ Use `NostrEventService.publishEvent()` for publishing
- ❌ FORBIDDEN: Building events in hooks/components
- ❌ FORBIDDEN: Direct relay communication outside service layer

**Phase 2 - Type Safety:**
- ✅ All types in `/src/types/shop.ts` (no inline types)
- ✅ Reuse `ProductAttachment` from `/src/types/attachments.ts`
- ❌ FORBIDDEN: Any types in components/hooks

**Phase 3 - Component Purity:**
- ✅ Components are presentation-only (no business logic)
- ✅ All state management via hooks
- ❌ FORBIDDEN: Service calls from components
- ❌ FORBIDDEN: Event building in components

**Phase 4 - Page Orchestration:**
- ✅ Pages coordinate components + hooks only
- ✅ Use existing hooks pattern (useAuthStore, useShopPublishing)
- ❌ FORBIDDEN: Business logic in pages
- ❌ FORBIDDEN: Direct service calls from pages

**Phase 5 - Navigation:**
- ✅ Auth-gated using existing `isAuthenticated` pattern
- ✅ Follow Header.tsx pattern
- ❌ FORBIDDEN: Custom auth logic

### Code Reuse Enforcement

**Mandatory Reuse (DO NOT DUPLICATE):**
1. `NostrEventService.createProductEvent()` - for Kind 30023 product events ✅
2. `GenericEventService.createDeletionEvent()` - for Kind 5 deletion events ✅
3. `GenericRelayService.queryEvents()` - for relay queries ✅
4. `NostrEventService.publishEvent()` - for event publishing ✅
5. `useAuthStore` - for authentication state ✅
6. `DeleteConfirmationModal` - from generic components ✅
7. `uploadSequentialWithConsent()` - for Blossom uploads ✅

**Pattern Reuse (STUDY THESE):**
1. **My Contributions Pattern** - for My Shop dashboard (EXACT copy)
2. **Contribution Service Pattern** - for ShopService implementation
3. **Header.tsx auth-gated navigation** - for My Shop link
4. **ContributionForm** - adapt to ProductForm (similar fields)

### Testing & Verification Requirements

**Definition of "Complete" for Shop:**

**Phase 1 Complete (Service Layer):**
- ✅ `npm run build` succeeds with new service methods
- ✅ Methods return proper types (not any/unknown)
- ✅ Logging added to all service methods
- ✅ Error handling uses AppError pattern

**Phase 2 Complete (Types):**
- ✅ Types compile without errors
- ✅ No circular dependencies introduced
- ✅ Types match service return types

**Phase 3 Complete (Components):**
- ✅ Components render without errors
- ✅ PropTypes validated
- ✅ Accessibility verified (keyboard nav, ARIA)

**Phase 4 Complete (My Shop Dashboard):**
- ✅ Dashboard loads products by author
- ✅ Statistics calculate correctly (total, by category, by condition)
- ✅ Filters work (search, category, condition, price range)
- ✅ Create navigates to create page
- ✅ Edit navigates with correct dTag
- ✅ Delete publishes Kind 5 event with NIP-09 compliance
- ✅ Ownership verified (pubkey match)

**Phase 5 Complete (Browse Shop):**
- ✅ Shop page loads public products from relays
- ✅ Search/filter functionality works
- ✅ Pagination works (load more)
- ✅ Product detail page loads
- ✅ Contact seller button (opens messages)

**Phase 6 Complete (Create/Edit Product):**
- ✅ Create page loads form
- ✅ Form validation works
- ✅ Media upload works (Blossom)
- ✅ Product publishes successfully
- ✅ Edit page loads product data
- ✅ Update uses existing `createProductEvent()` with existingDTag
- ✅ Auto-redirect after success

**Phase 7 Complete (Navigation):**
- ✅ Shop link shows for all users
- ✅ My Shop link shows only when authenticated
- ✅ My Shop link hidden when not authenticated
- ✅ Navigation functional on desktop + mobile

**Phase 8 Complete (End-to-End):**
- ✅ User creates product → appears in my-shop
- ✅ User edits product → updates appear
- ✅ User deletes product → disappears from list + Kind 5 published
- ✅ Ownership verified (can't edit others' products)
- ✅ Public products appear in browse
- ✅ Tested on https://nostrcoin.vercel.app (not localhost)

**Phase 9 Complete (Documentation):**
- ✅ NIP matrix updated with Shop status
- ✅ README updated with Shop feature
- ✅ All changes committed with proper message format

### Anti-Pattern Prevention

**RED FLAGS - STOP IMMEDIATELY IF:**
- 🚩 Writing event creation logic in hook (use NostrEventService)
- 🚩 Querying relays directly from component (use service layer)
- 🚩 Creating new tag patterns (use `nostr-for-nomads-shop`)
- 🚩 Duplicating NostrEventService logic (reuse it)
- 🚩 Building without testing each phase
- 🚩 Marking complete without user verification

**MANDATORY QUESTIONS BEFORE EACH PHASE:**
1. **Does this violate SOA?** → If yes, redesign
2. **Can I reuse existing code?** → Grep first, then code
3. **Is this the contributions pattern?** → Follow it, don't deviate
4. **Have I tested this phase?** → Test before moving on
5. **Does user confirm it works?** → Get explicit confirmation

### Workflow Enforcement (EVERY PHASE)

```text
1. CODE → Write the phase implementation
2. BUILD → npm run build (fix all errors)
3. TEST → Manual testing of that phase
4. VERIFY → User confirms functionality
5. COMMIT → git add . && git commit -m "feat: [phase description]"
6. PUSH → git push origin main
7. CONFIRM → User tests on Vercel production
8. NEXT → Move to next phase only after confirmation
```

**NO SKIPPING STEPS. NO BATCHING PHASES WITHOUT APPROVAL.**

---

## Phase 1: Type Definitions

### 1.1 Create Shop Types File
- **File**: `/src/types/shop.ts` (NEW)
- **Action**: CREATE new file
- **Inspiration**: `/src/types/contributions.ts`
- **Interfaces**:

```typescript
import type { ProductAttachment } from './attachments';
import type { NostrEvent } from './nostr';

/**
 * Product form data interface
 * Maps to ProductForm fields
 */
export interface ProductData {
  // Basic Information
  title: string;
  description: string;
  price: number;
  currency: 'BTC' | 'sats' | 'USD';
  
  // Product Details
  category: string;
  condition: 'new' | 'used' | 'refurbished';
  location: string;
  contact: string; // Nostr npub or contact method
  
  // Media & Attachments
  attachments: ProductAttachment[];
  
  // Tags & Keywords
  tags: string[];
}

/**
 * Product Nostr event (Kind 30023)
 */
export interface ProductNostrEvent extends NostrEvent {
  kind: 30023;
  tags: [
    ['d', string], // Unique identifier (dTag)
    ['t', 'nostr-for-nomads-shop'], // System tag (hidden)
    ['title', string],
    ['price', string],
    ['currency', string],
    ['category', string],
    ['condition', string],
    ['location', string],
    ['contact', string],
    ...Array<
      | ['t', string] // User tags
      | ['image', string] // Media URLs
      | ['video', string]
      | ['audio', string]
      | ['imeta', ...string[]] // NIP-94 metadata
    >
  ];
  content: string; // JSON stringified description
}

/**
 * Product event from relay (parsed)
 */
export interface ProductEvent {
  id: string;
  dTag: string;
  pubkey: string;
  title: string;
  summary: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: string;
  contact: string;
  tags: string[];
  media: {
    images: MediaAttachment[];
    audio: MediaAttachment[];
    videos: MediaAttachment[];
  };
  createdAt: number;
  publishedAt: number;
}

/**
 * Product card data for display
 */
export interface ProductCardData {
  id: string;
  dTag: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: string;
  imageUrl?: string; // First media URL
  tags: string[];
  pubkey: string; // Author for ownership check
  createdAt: number;
}

/**
 * Type alias: ShopProduct is same as ProductCardData
 * Used in stores for consistency with temp-cb-reference pattern
 */
export type ShopProduct = ProductCardData;

/**
 * Type alias: ProductExploreItem is same as ProductCardData
 * Used in public browse/explore views
 */
export type ProductExploreItem = ProductCardData;

/**
 * Product publishing result
 */
export interface ProductPublishingResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  error?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  [key: string]: unknown;
}

/**
 * Product publishing state
 */
export interface ProductPublishingState {
  isPublishing: boolean;
  uploadProgress: number | ProductPublishingProgress;
  currentStep: 'idle' | 'validating' | 'uploading' | 'creating' | 'publishing' | 'complete' | 'error';
  error: string | null;
  result: ProductPublishingResult | null;
}

/**
 * Product publishing progress
 */
export interface ProductPublishingProgress {
  step: 'validating' | 'uploading' | 'publishing' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: string;
  attachmentProgress?: {
    current: number;
    total: number;
    currentFile: string;
  };
}

/**
 * Product validation result
 */
export interface ProductValidationResult {
  valid: boolean;
  errors: {
    title?: string;
    description?: string;
    price?: string;
    currency?: string;
    category?: string;
    condition?: string;
    location?: string;
    contact?: string;
    attachments?: string;
    tags?: string;
  };
}

interface MediaAttachment {
  url: string;
  mimeType?: string;
  hash?: string;
  size?: number;
}
```

---

## Phase 2: Service Layer - ShopService

### 2.1 Create ShopService (Business Layer)
- **File**: `/src/services/business/ShopService.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/services/business/ContributionService.ts`
- **Adapt**: Replace contribution → product terminology

**Methods to Implement:**

```typescript
/**
 * Create a new product with file upload, event creation and publishing
 * Orchestrates: validation → upload → event creation → publishing
 * 
 * @param productData - Product data
 * @param attachmentFiles - File objects to upload
 * @param signer - Nostr signer
 * @param existingDTag - Optional dTag for updates
 * @param onProgress - Optional callback for progress updates
 */
export async function createProduct(
  productData: ProductData,
  attachmentFiles: File[],
  signer: NostrSigner,
  existingDTag?: string,
  onProgress?: (progress: ProductPublishingProgress) => void
): Promise<ProductPublishingResult>

/**
 * Fetch products by author pubkey
 * Business layer method for querying user's own products
 * 
 * @param pubkey - Author's public key
 * @returns Array of product events authored by this user
 */
export async function fetchProductsByAuthor(
  pubkey: string
): Promise<ProductEvent[]>

/**
 * Fetch a single product by dTag
 * Business layer method for retrieving specific product (for edit page)
 * 
 * @param dTag - The product's dTag identifier
 * @returns Product event or null if not found
 */
export async function fetchProductById(
  dTag: string
): Promise<ProductEvent | null>

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
): Promise<{ success: boolean; publishedRelays?: string[]; failedRelays?: string[]; error?: string }>

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
): Promise<ProductExploreItem[]>
```

**Key Implementation Details:**
- Use `NostrEventService.createProductEvent()` (line 47-170) - **UPDATE TAG** to `nostr-for-nomads-shop`
- Use `GenericEventService.createDeletionEvent()` for NIP-09
- Use `GenericRelayService.queryEvents()` for queries
- Use `uploadSequentialWithConsent()` for Blossom uploads
- Query filter: `{ kinds: [30023], '#t': ['nostr-for-nomads-shop'] }`
- Deduplicate by dTag (NIP-33 parameterized replaceable)
- Extract media using `GenericContributionService.extractMedia()`

---

## Phase 3: Service Layer - GenericShopService

### 3.1 Create GenericShopService (Protocol Layer)
- **File**: `/src/services/generic/GenericShopService.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/services/generic/GenericContributionService.ts`
- **Adapt**: Replace contribution → product

**Methods to Implement:**

```typescript
/**
 * Fetch public products from relays
 * @param limit - Max products to fetch
 * @param until - Pagination timestamp
 * @returns Array of ProductEvent
 */
export async function fetchPublicProducts(
  limit = 20,
  until?: number
): Promise<ProductEvent[]>

/**
 * Parse product event from Nostr event
 * @param event - Raw Nostr event
 * @returns ProductEvent or null
 */
function parseProductEvent(event: NostrEvent): ProductEvent | null
```

**Query Pattern:**
```typescript
const filter = {
  kinds: [30023],
  '#t': ['nostr-for-nomads-shop'],
  limit,
  ...(until && { until })
};
```

---

## Phase 4: Service Layer - ProductValidationService

### 4.1 Create ProductValidationService (Business Layer)
- **File**: `/src/services/business/ProductValidationService.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/services/business/ContributionValidationService.ts`
- **Adapt**: Product-specific validation rules

**Validation Rules:**
- `title`: Required, 5-100 characters
- `description`: Required, 20-5000 characters
- `price`: Required, number > 0
- `currency`: Required, one of ['BTC', 'sats', 'USD']
- `category`: Required, valid category
- `condition`: Required, one of ['new', 'used', 'refurbished']
- `location`: Required, 3-100 characters
- `contact`: Required, valid npub or contact info
- `attachments`: Max 10 files, max 100MB per file
- `tags`: Optional, max 20 tags

---

## Phase 5: Configuration

### 5.1 Create Shop Config File
- **File**: `/src/config/shop.ts` (NEW)
- **Action**: CREATE new file

```typescript
export const PRODUCT_CATEGORIES = [
  { id: 'art', name: 'Art & Collectibles', icon: '🎨' },
  { id: 'services', name: 'Services', icon: '⚙️' },
  { id: 'hardware', name: 'Hardware', icon: '💻' },
  { id: 'software', name: 'Software', icon: '📱' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'fashion', name: 'Fashion', icon: '👕' },
  { id: 'food', name: 'Food & Drink', icon: '🍕' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'sports', name: 'Sports & Outdoors', icon: '⚽' },
  { id: 'other', name: 'Other', icon: '📦' },
];

export const PRODUCT_CONDITIONS = [
  { id: 'new', name: 'New', description: 'Brand new, never used' },
  { id: 'used', name: 'Used', description: 'Previously used, good condition' },
  { id: 'refurbished', name: 'Refurbished', description: 'Professionally restored' },
];

export const CURRENCIES = [
  { id: 'BTC', name: 'Bitcoin (BTC)', symbol: '₿' },
  { id: 'sats', name: 'Satoshis (sats)', symbol: 'sats' },
  { id: 'USD', name: 'US Dollar (USD)', symbol: '$' },
];

export function getProductCategories() {
  return PRODUCT_CATEGORIES;
}

export function getProductConditions() {
  return PRODUCT_CONDITIONS;
}

export function getCurrencies() {
  return CURRENCIES;
}
```

---

## Phase 6: State Management Stores

**Pattern from temp-cb-reference:** Zustand stores for centralized state management, separate from hooks.

### 6.1 Create useShopStore (Public Browse State)
- **File**: `/src/stores/useShopStore.ts` (NEW)
- **Action**: CREATE new file
- **Reference**: `temp-cb-reference/src/stores/useShopStore.ts`
- **Purpose**: Centralized state for public shop browsing

**Store State:**
```typescript
import type { ProductCardData } from '@/types/shop';

// ShopProduct = ProductCardData (type alias for consistency)
export type ShopProduct = ProductCardData;

export interface ShopState {
  // Products
  products: ShopProduct[]; // Array of ProductCardData
  isLoadingProducts: boolean;
  productsError: string | null;
  
  // UI State
  searchQuery: string;
  selectedCategory: string;
  selectedCondition: string;
  priceRange: { min: number; max: number };
  sortBy: 'newest' | 'oldest' | 'price-low' | 'price-high';
  viewMode: 'grid' | 'list';
  
  // Actions
  setProducts: (products: ShopProduct[]) => void;
  setLoadingProducts: (loading: boolean) => void;
  setProductsError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedCondition: (condition: string) => void;
  setPriceRange: (range: { min: number; max: number }) => void;
  setSortBy: (sortBy: 'newest' | 'oldest' | 'price-low' | 'price-high') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Computed getters
  getFilteredProducts: () => ShopProduct[];
  getProductsByCategory: (category: string) => ShopProduct[];
  searchProducts: (query: string) => ShopProduct[];
  clearFilters: () => void;
  reset: () => void;
}
```

**Key Features:**
- Zustand devtools for debugging
- Computed getters for filtered/searched products
- UI state (filters, search, sort, view mode)
- No persistence (public browse data, ephemeral)

### 6.2 Create useMyShopStore (User's Products State)
- **File**: `/src/stores/useMyShopStore.ts` (NEW)
- **Action**: CREATE new file
- **Reference**: `temp-cb-reference/src/stores/useMyShopStore.ts`
- **Purpose**: Centralized state for user's product management

**Store State:**
```typescript
export interface MyShopState {
  // Products
  myProducts: ShopProduct[];
  isLoadingMyProducts: boolean;
  myProductsError: string | null;
  
  // Editing
  editingProduct: ShopProduct | null;
  isEditing: boolean;
  isUpdating: boolean;
  updateProgress: ShopPublishingProgress | null;
  updateError: string | null;
  
  // Deleting
  isDeleting: boolean;
  deleteProgress: ShopPublishingProgress | null;
  deleteError: string | null;
  
  // UI State
  showCreateForm: boolean;
  showDeleteDialog: boolean;
  deletingProduct: ShopProduct | null;
  
  // Actions
  setMyProducts: (products: ShopProduct[]) => void;
  setLoadingMyProducts: (loading: boolean) => void;
  setMyProductsError: (error: string | null) => void;
  
  // Edit actions
  startEditing: (product: ShopProduct) => void;
  cancelEditing: () => void;
  setUpdating: (updating: boolean) => void;
  setUpdateProgress: (progress: ShopPublishingProgress | null) => void;
  setUpdateError: (error: string | null) => void;
  
  // Delete actions
  setDeleting: (deleting: boolean) => void;
  setDeleteProgress: (progress: ShopPublishingProgress | null) => void;
  setDeleteError: (error: string | null) => void;
  
  // Utility actions
  addProduct: (product: ShopProduct) => void;
  updateProduct: (productId: string, updatedProduct: ShopProduct) => void;
  removeProduct: (productId: string) => void;
  clearErrors: () => void;
}
```

**Key Features:**
- Tracks editing/deleting progress (for real-time UI feedback)
- Modal/dialog state management
- Error handling per operation
- No persistence (re-fetch from relays on mount)

### 6.3 Why Separate Stores?

**Separation of Concerns:**
- `useShopStore`: Public browse (anyone can use, no auth required)
- `useMyShopStore`: User's products (auth-gated, management operations)

**Benefits:**
- Clear ownership boundaries
- Independent state lifecycles
- No auth state pollution in public store
- Easier testing and debugging

---

## Phase 7: Hooks

**Hook-Store Integration Pattern:**
Hooks orchestrate business logic and update Zustand stores. Pattern from temp-cb-reference:
- Hooks call service methods (ShopService, GenericShopService)
- Hooks update store state (useShopStore, useMyShopStore) 
- Components consume store state (no direct service calls)
- Clean separation: Services = data, Stores = state, Hooks = orchestration

### 7.1 Create useShopPublishing Hook
- **File**: `/src/hooks/useShopPublishing.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/hooks/useContributionPublishing.ts`
- **Adapt**: Replace contribution → product

**Hook Interface:**
```typescript
export function useShopPublishing() {
  return {
    isPublishing: boolean;
    uploadProgress: number | ProductPublishingProgress;
    currentStep: string;
    error: string | null;
    result: ProductPublishingResult | null;
    publishProduct: (productData, files, signer, existingDTag?) => Promise<void>;
    reset: () => void;
  };
}
```

### 7.2 Create usePublicProducts Hook
- **File**: `/src/hooks/usePublicProducts.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/hooks/useExploreContributions.ts`
- **Adapt**: Replace contribution → product
- **Store Integration**: Updates `useShopStore` with fetched products

**Hook Interface:**
```typescript
export function usePublicProducts(limit = 20) {
  return {
    products: ProductExploreItem[]; // From useShopStore.products
    isLoading: boolean; // From useShopStore.isLoadingProducts
    error: string | null; // From useShopStore.productsError
    hasMore: boolean;
    loadMore: () => Promise<void>; // Calls ShopService.fetchPublicProducts(), updates store
    refresh: () => Promise<void>; // Re-fetches from relays, resets pagination
  };
}
```

**Behavior:**
- **Auto-load on mount**: Fetches products when hook first used
- **PAGE REFRESH**: Re-fetches on every `/shop` page visit
- Updates `useShopStore.setProducts()` with results
- Handles pagination state internally (`until` timestamp)

### 7.3 Create useProductEditing Hook
- **File**: `/src/hooks/useProductEditing.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/hooks/useContributionEditing.ts`
- **Adapt**: Replace contribution → product
- **Store Integration**: Updates `useMyShopStore` editing state

**Hook Interface:**
```typescript
export function useProductEditing() {
  return {
    editingProduct: ProductCardData | null; // From useMyShopStore.editingProduct
    isEditing: boolean; // From useMyShopStore.isEditing
    isUpdating: boolean; // From useMyShopStore.isUpdating
    updateProgress: ProductPublishingProgress | null;
    updateError: string | null;
    startEditing: (product: ProductCardData) => void; // Calls useMyShopStore.startEditing()
    cancelEditing: () => void; // Calls useMyShopStore.cancelEditing()
    updateProduct: (data: ProductData, files: File[]) => Promise<void>; // Updates via ShopService
  };
}
```

### 7.4 Create useMyShopProducts Hook
- **File**: `/src/hooks/useMyShopProducts.ts` (NEW)
- **Action**: CREATE new file
- **Reference**: `temp-cb-reference/src/hooks/useMyShopProducts.ts`
- **Store Integration**: Updates `useMyShopStore` with user's products

**Purpose:**
Orchestrates fetching user's products and updating My Shop store.

**Hook Interface:**
```typescript
export function useMyShopProducts() {
  return {
    products: ProductCardData[]; // From useMyShopStore.myProducts
    isLoading: boolean; // From useMyShopStore.isLoadingMyProducts
    error: string | null; // From useMyShopStore.myProductsError
    loadMyProducts: () => Promise<void>; // Manual refresh
  };
}
```

**Implementation Pattern (from temp-cb-reference):**
```typescript
const loadMyProducts = useCallback(async () => {
  if (!pubkey || !isAuthenticated) return;
  
  setLoadingMyProducts(true);
  setMyProductsError(null);
  
  try {
    // Fetch ALL products from relays
    const result = await ShopService.fetchPublicProducts();
    
    // Filter by current user's pubkey (client-side)
    const userProducts = result.filter(p => p.pubkey === pubkey);
    
    // Sort by newest first
    const sorted = userProducts.sort((a, b) => b.createdAt - a.createdAt);
    
    // Update store
    setMyProducts(sorted);
  } catch (error) {
    setMyProductsError(error.message);
  } finally {
    setLoadingMyProducts(false);
  }
}, [pubkey, isAuthenticated]);

// Auto-load on mount when authenticated
useEffect(() => {
  if (pubkey && isAuthenticated) {
    loadMyProducts();
  }
}, [pubkey, isAuthenticated, loadMyProducts]);
```

**Behavior:**
- **Auto-load on mount**: Fetches when user authenticated
- **PAGE REFRESH**: Re-fetches on every `/my-shop` page visit
- **Client-side filtering**: Fetches all, filters by pubkey (SoA pattern)
- Updates `useMyShopStore.setMyProducts()` with filtered results

**Why fetch-all-then-filter?**
- Consistent with temp-cb-reference pattern
- Simpler relay queries (no author filter needed)
- Works with all relay types
- Can add caching later

---

## Phase 8: Components

### 8.1 Create MyProductCard Component
- **File**: `/src/components/generic/MyProductCard.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/components/generic/MyContributionCard.tsx`
- **Adapt**: Product-specific display fields

**Props:**
```typescript
{
  product: ProductCardData;
  onEdit: (product: ProductCardData) => void;
  onDelete: (product: ProductCardData) => void;
}
```

**Display Fields:**
- Title, description (truncated)
- Price + currency badge
- Category, condition badges
- Location
- Image thumbnail
- Actions: View, Edit, Delete

### 8.2 Create ProductForm Component
- **File**: `/src/components/pages/ProductForm.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/components/pages/ContributionForm.tsx` (if exists) or adapt
- **Purpose**: Reusable form for creating and editing products

**Form Fields (matches user-facing section):**

1. **Basic Information Section**:
   - `title` - Text input (required, 5-100 characters)
   - `price` - Number input (required, > 0)
   - `currency` - Dropdown (BTC, sats, USD) - matches `/config/shop.ts` CURRENCIES

2. **Product Details Section**:
   - `category` - Dropdown (Art, Services, Hardware, Software, etc.) - matches `/config/shop.ts` PRODUCT_CATEGORIES
   - `condition` - Dropdown (New, Used, Refurbished) - matches `/config/shop.ts` PRODUCT_CONDITIONS
   - `location` - Text input (required, 3-100 characters)
   - `contact` - Text input (defaults to user's npub, can customize)

3. **Description Section**:
   - `description` - TipTap rich text editor (required, 20-5000 characters)
   - Supports: bold, italic, links, lists, headings

4. **Media & Attachments Section**:
   - Image/video upload via Blossom (NIP-96)
   - Max 10 files, max 100MB per file
   - Preview thumbnails with remove option
   - Drag-and-drop support

5. **Tags & Keywords Section**:
   - `tags` - Tag input (optional, max 20 tags)
   - Auto-suggestions from existing tags

**Form Actions**:
- "Publish Product" / "Update Product" button
- "Cancel" button (navigates back to `/my-shop`)
- Real-time validation with error messages
- Loading state during publish

**Props:**
```typescript
{
  initialData?: ProductData; // For edit mode
  mode: 'create' | 'edit';
  onSubmit: (data: ProductData, files: File[]) => Promise<void>;
  onCancel: () => void;
  isPublishing: boolean;
}
```

### 8.3 Create ShopContent Component
- **File**: `/src/components/pages/ShopContent.tsx` (NEW)
- **Action**: CREATE new file
- **Adapt from**: Current `/src/app/shop/page.tsx` (move logic to component)
- **Features**:
  - Product grid/list view toggle
  - Search bar
  - Category filter
  - Condition filter
  - Price range filter
  - Sort options (newest, price low-high, price high-low)
  - Pagination (load more)
  - Product cards with click to detail

### 8.4 Reuse DeleteConfirmationModal
- **File**: `/src/components/generic/DeleteConfirmationModal.tsx`
- **Action**: REUSE existing component (no changes needed)

---

## Phase 9: Pages

**Page Refresh Behavior:**
All pages re-fetch data on every visit (no caching between navigations).
- `/shop` → Calls `usePublicProducts()` → Fetches from relays
- `/my-shop` → Calls `useMyShopProducts()` → Fetches from relays
- `/shop/[id]` → Fetches specific product by dTag
- `/my-shop/edit/[id]` → Fetches specific product by dTag

### 9.1 Update Shop Browse Page
- **File**: `/src/app/shop/page.tsx`
- **Action**: MODIFY existing file
- **Changes**:
  - Remove mock data
  - Import `ShopContent` component
  - Add Nostr integration
  - Keep auth check (public page, no auth required)

### 9.2 Create My Shop Dashboard Page
- **Hook Used**: `useMyShopProducts()` - Auto-loads on page visit
- **File**: `/src/app/my-shop/page.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/app/my-contributions/page.tsx`
- **Adapt**: Replace contribution → product

**Features:**
- Auth-gated (redirect to signin if not authenticated)
- Fetch user's products via `fetchProductsByAuthor()`
- Statistics dashboard (total products, by category, by condition, total value)
- Filter panel (search, category, condition, price range)
- Grid/list view toggle
- Product cards with Edit/Delete actions
- Create Product button (navigates to `/my-shop/create`)
- Loading/error states
- Empty states

### 9.3 Create Product Detail Page
- **File**: `/src/app/shop/[id]/page.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/app/explore/[id]/page.tsx` (if exists)
- **Adapt**: Product-specific display

**Features:**
- Fetch product by dTag via `fetchProductById()`
- Display all product info (price, condition, location, contact)
- Media gallery (images/videos)
- Contact seller button (opens messages)
- Tags display
- Seller profile preview
- Share button
- Loading/error/not found states

### 9.4 Create Product Create Page
- **File**: `/src/app/my-shop/create/page.tsx` (NEW)
- **Action**: CREATE new file
- **Features**:
  - Auth-gated
  - Render `ProductForm` component
  - Handle form submission via `useShopPublishing`
  - Auto-redirect to My Shop after success

### 9.5 Create Product Edit Page
- **File**: `/src/app/my-shop/edit/[id]/page.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/app/my-contributions/edit/[id]/page.tsx`
- **Adapt**: Product-specific

**Features:**
- Auth-gated
- Fetch product by dTag via `fetchProductById()`
- Ownership verification (pubkey match)
- Pre-populate `ProductForm` with existing data
- Convert media to ProductAttachment format
- Handle update via `createProduct(data, files, signer, existingDTag)`
- Auto-redirect to My Shop after success

### 9.6 Create My Shop Layout (Optional)
- **File**: `/src/app/my-shop/layout.tsx` (OPTIONAL)
- **Action**: CREATE new file (if shared layout needed)

---

## Phase 10: Navigation

### 10.1 Add My Shop Link to Header
- **File**: `/src/components/Header.tsx`
- **Action**: MODIFY existing file
- **Changes**:
  - Add "My Shop" link in authenticated user menu
  - Desktop: Add to top nav after "Shop"
  - Mobile: Add to mobile menu (authenticated section)
  - Icon: ShoppingBag or Store icon

**Example:**
```tsx
{isAuthenticated && (
  <Link
    href="/my-shop"
    className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
  >
    <Store className="w-5 h-5" />
    My Shop
  </Link>
)}
```

---

## Phase 11: Testing & Verification

### 11.1 Build Test
- **Command**: `npm run build`
- **Verify**: No TypeScript errors
- **Fix**: Any type mismatches or import errors

### 11.2 Manual Testing Checklist
- [ ] Navigate to `/shop` (public)
- [ ] See public products from relays
- [ ] Search products by keyword
- [ ] Filter by category, condition, price
- [ ] Toggle grid/list view
- [ ] Click product → opens detail page
- [ ] Navigate to `/my-shop` (authenticated)
- [ ] See own products dashboard
- [ ] Statistics display correctly
- [ ] Filter own products
- [ ] Click "Create Product" → navigates to create page
- [ ] Create product form validation works
- [ ] Upload product images (Blossom)
- [ ] Publish product successfully
- [ ] Product appears in My Shop
- [ ] Product appears in public Shop
- [ ] Click "Edit" → loads product data
- [ ] Update product successfully
- [ ] Updated data appears
- [ ] Click "Delete" → opens confirmation modal
- [ ] Confirm delete → publishes NIP-09 event
- [ ] Deleted product removed from list
- [ ] Empty state shows for no products
- [ ] Filtered empty state shows "no matches"
- [ ] Loading states display correctly
- [ ] Error states display with retry option
- [ ] Contact seller button works (opens messages)
- [ ] Auth-gated pages redirect if not authenticated

### 11.3 Nostr Event Verification
- [ ] Query relays for products by author pubkey
- [ ] Verify Kind 30023 events returned
- [ ] Verify `#t` tag includes `nostr-for-nomads-shop`
- [ ] Verify product-specific tags (price, currency, category, condition)
- [ ] Update creates new event with same dTag (NIP-33)
- [ ] Delete publishes Kind 5 event with correct reference
- [ ] Deleted products no longer appear in queries

---

## Phase 12: Documentation

### 12.1 Update NIP Implementation Matrix
- **File**: `/docs/nip-kind-implementation-matrix.md`
- **Action**: UPDATE
- **Changes**:
  - Change Shop status: "Mock Data" → "Production"
  - Update NIPs row: Add NIP-09 (deletion), NIP-23, NIP-33, NIP-96
  - Update Kind 30023 usage
  - Add notes about product features

### 12.2 Update README
- **File**: `/README.md`
- **Action**: UPDATE
- **Changes**:
  - Move Shop from "UI-Only Features" → "Production Features"
  - Add description: "Decentralized marketplace for products and services"
  - Add technical details (Kind 30023, multi-attachment support, etc.)

---

## Implementation Order (Recommended)

1. **Types** (Phase 1) - Foundation for all other code
2. **Configuration** (Phase 5) - Categories, conditions, currencies
3. **Service Layer** (Phase 2-4) - Business logic, validation, protocol
4. **Build & Test Services** (Phase 11.1) - Verify compilation
5. **Stores** (Phase 6) - Zustand state management (useShopStore, useMyShopStore)
6. **Hooks** (Phase 7) - State management layer (useShopPublishing, usePublicProducts, useProductEditing)
7. **Components** (Phase 8) - UI building blocks
8. **My Shop Pages** (Phase 9.2, 9.4, 9.5) - User's product management
9. **Shop Browse** (Phase 9.1, 9.3) - Public marketplace
10. **Navigation** (Phase 10) - Header links
11. **Manual Testing** (Phase 11.2-11.3) - End-to-end verification
12. **Documentation** (Phase 12) - Update docs

---

## Files Summary

### New Files (26 total)
1. `/src/types/shop.ts` - Type definitions (ProductData, ProductCardData, ShopProduct alias, etc.)
2. `/src/config/shop.ts` - Categories, conditions, currencies
3. `/src/services/business/ShopService.ts` - Business logic orchestration
4. `/src/services/business/ProductValidationService.ts` - Validation rules
5. `/src/services/generic/GenericShopService.ts` - Protocol layer queries
6. `/src/stores/useShopStore.ts` - Public browse state (Zustand) ← from temp-cb-reference
7. `/src/stores/useMyShopStore.ts` - User products state (Zustand) ← from temp-cb-reference
8. `/src/hooks/useShopPublishing.ts` - Product publishing orchestration
9. `/src/hooks/usePublicProducts.ts` - Public browse hook + store integration
10. `/src/hooks/useProductEditing.ts` - Edit product orchestration
11. `/src/hooks/useMyShopProducts.ts` - My Shop data fetching ← from temp-cb-reference
12. `/src/components/generic/MyProductCard.tsx` - Product card for dashboard
13. `/src/components/pages/ProductForm.tsx` - Create/edit form
14. `/src/components/pages/ShopContent.tsx` - Browse products component
15. `/src/app/my-shop/page.tsx` - My Shop dashboard page
16. `/src/app/my-shop/create/page.tsx` - Create product page
17. `/src/app/my-shop/edit/[id]/page.tsx` - Edit product page
18. `/src/app/my-shop/layout.tsx` - My Shop layout (optional)
19. `/src/app/shop/[id]/page.tsx` - Product detail page
20. `/docs/shop-implementation-plan.md` - This file

### Modified Files (3)
1. `/src/app/shop/page.tsx` - Replace mock data with Nostr integration
2. `/src/components/Header.tsx` - Add My Shop navigation link
3. `/docs/nip-kind-implementation-matrix.md` - Update Shop status
4. `/README.md` - Document Shop feature

### Existing Files (Reused)
1. `/src/services/nostr/NostrEventService.ts` - `createProductEvent()` already exists
2. `/src/services/generic/GenericEventService.ts` - Deletion, signing
3. `/src/services/generic/GenericRelayService.ts` - Query, publish
4. `/src/services/generic/GenericBlossomService.ts` - Media uploads
5. `/src/components/generic/DeleteConfirmationModal.tsx` - Reuse as-is
6. `/src/types/attachments.ts` - ProductAttachment type exists

---

## Key Adaptations Required

### Terminology Changes
- `contribution` → `product`
- `contributionType` → `category`
- `Contribution` → `Product`
- `nostr-for-nomads-contribution` → `nostr-for-nomads-shop`

### New Fields (Product-Specific)
- `price: number`
- `currency: string` (BTC, sats, USD)
- `condition: string` (new, used, refurbished)
- `contact: string` (npub or contact method)

### Tag Changes
- Discovery tag: `nostr-for-nomads-shop` (updated from legacy `culture-bridge-shop`)
- Product tags: `price`, `currency`, `category`, `condition`, `contact`

### Event Structure (Already Implemented)
```typescript
// NostrEventService.createProductEvent() creates this structure:
Kind 30023 {
  tags: [
    ['d', 'product-{timestamp}-{random}'],
    ['t', 'nostr-for-nomads-shop'], // System tag (hidden)
    ['title', title],
    ['price', price.toString()],
    ['currency', currency],
    ['category', category],
    ['condition', condition],
    ['contact', contact],
    ['t', ...userTags],
    ['imeta', ...mediaMetadata], // NIP-94
  ],
  content: JSON.stringify(description)
}
```

---

## Success Criteria

✅ User can browse public products in Shop
✅ User can search/filter products by category, condition, price
✅ User can view product details
✅ User can contact sellers via Nostr messages
✅ User can create products (My Shop)
✅ User can edit their products
✅ User can delete their products (NIP-09)
✅ User can see statistics about their products
✅ Ownership is verified before edit/delete
✅ All operations publish to Nostr relays
✅ Build succeeds with no errors
✅ SOA architecture maintained
✅ Documentation updated

---

**Estimated Implementation Time**: 6-8 hours (with copy/adapt strategy)
**Complexity**: Medium-Low (service layer complete, mostly UI adaptation)
**Risk**: Very Low (proven patterns, existing infrastructure, service layer ready)

---

## 🎯 Critical Success Factors

1. **Reuse NostrEventService.createProductEvent()** - Don't rebuild event creation (UPDATE tag to `nostr-for-nomads-shop`)
2. **Copy My Contributions pattern** - Proven CRUD dashboard
3. **Follow SOA strictly** - Page → Component → Hook → Service
4. **Test incrementally** - Verify each phase before moving on
5. **Use nostr-for-nomads-shop tag** - Platform naming consistency
6. **Leverage existing Blossom uploads** - Media infrastructure ready
7. **Maintain product-specific validation** - Price, currency, condition rules

---

**Last Updated**: November 16, 2025  
**Status**: PLANNING - Ready for implementation  
**Service Layer**: ✅ COMPLETE (NostrEventService.createProductEvent exists)  
**UI Layer**: ❌ PENDING (needs Nostr integration)
