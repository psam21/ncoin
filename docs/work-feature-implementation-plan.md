# Work Feature Implementation Plan

**Feature:** Job Board / Freelance Work Marketplace  
**Pattern Source:** Contributions Feature (CRUD with Nostr integration)  
**Status:** Not Started  
**Created:** November 21, 2025

---

## Implementation Overview

This document outlines the comprehensive, step-by-step implementation of the Work feature, following the exact pattern established by the Contributions feature. All changes adhere to the guidelines in `/home/jack/Documents/ncoin/docs/nc-critical-guidelines.md`.

**Critical Principles:**
- ✅ Follow SOA (Service-Oriented Architecture) strictly
- ✅ Reuse existing services (GenericEventService, GenericRelayService)
- ✅ Use NIP-23 (Kind 30023) parameterized replaceable events
- ✅ Use tag system: `['t', 'nostr-for-nomads-work']`
- ✅ Test each step before proceeding
- ✅ Build incrementally, verify continuously

---

## Phase 1: Foundation (Types & Configuration)

### 1.1 Create Work Types (`src/types/work.ts`)

**Action:** CREATE new file  
**Pattern:** Copy from `src/types/contributions.ts`, adapt field names  
**Status:** Not Started

**File Structure:**
```typescript
import type { GenericAttachment } from './attachments';
import type { NostrEvent } from './nostr';

// Core interfaces
- WorkData (form submission data)
- WorkNostrEvent (Kind 30023 with work-specific tags)
- WorkEventData (for event creation)
- WorkPublishingResult
- WorkPublishingState
- WorkPublishingProgress
- WorkAttachment (extends GenericAttachment)
- WorkValidationResult
- Work (display interface)
- WorkCardData (for my-work dashboard)
- WorkEvent (parsed from Nostr event)
- WorkCustomFields (for content detail)

// Tag constants
- WORK_TAG_KEYS
- WORK_SYSTEM_TAG = 'nostr-for-nomads-work'

// Helper functions
- parseWorkEvent(event: NostrEvent): Work | null
- isWorkEvent(event: NostrEvent): boolean
```

**Key Fields:**
```typescript
interface WorkData {
  // Basic Information
  title: string;
  category: string; // 'Development', 'Design', 'Writing', 'Marketing', 'Support', 'Other'
  jobType: string; // 'remote', 'on-site', 'hybrid'
  
  // Details
  description: string;
  duration: string; // '1 week', '2 months', '3+ months'
  language?: string;
  location?: string; // City/place (for on-site/hybrid)
  region: string;
  country: string;
  
  // Compensation
  payRate: number;
  currency: string; // 'BTC', 'sats', 'USD', 'per hour', 'per day', 'per project'
  
  // Media & Tags
  attachments: GenericAttachment[];
  tags: string[];
  
  // Contact (optional - uses Nostr DMs by default)
  contact?: string;
}
```

**Tags Structure:**
```typescript
['d', dTag], // Unique identifier
['t', 'nostr-for-nomads-work'], // System tag
['title', title],
['category', category],
['job-type', jobType],
['duration', duration],
['region', region],
['country', country],
['pay-rate', payRate.toString()],
['currency', currency],
['language', language?],
['location', location?],
['contact', contact?],
['t', ...userTags], // User-defined tags
['image', imageUrl], // Media
['video', videoUrl],
['audio', audioUrl],
```

**Dependencies:** None  
**Testing:** Import types in a test file, verify TypeScript compilation

---

### 1.2 Create Work Configuration (`src/config/work.ts`)

**Action:** CREATE new file  
**Pattern:** Similar to `src/config/contributions.ts`  
**Status:** Not Started

**Content:**
```typescript
export const WORK_CATEGORIES = [
  { id: 'development', name: 'Development', icon: '💻' },
  { id: 'design', name: 'Design', icon: '🎨' },
  { id: 'writing', name: 'Writing', icon: '✍️' },
  { id: 'marketing', name: 'Marketing', icon: '📢' },
  { id: 'support', name: 'Support', icon: '🎧' },
  { id: 'other', name: 'Other', icon: '🔧' },
] as const;

export const WORK_JOB_TYPES = [
  { id: 'remote', name: 'Remote', icon: '🌍' },
  { id: 'on-site', name: 'On-site', icon: '🏢' },
  { id: 'hybrid', name: 'Hybrid', icon: '🔀' },
] as const;

export const WORK_DURATIONS = [
  { id: '1-week', name: '1 Week', value: '1 week' },
  { id: '2-weeks', name: '2 Weeks', value: '2 weeks' },
  { id: '1-month', name: '1 Month', value: '1 month' },
  { id: '2-months', name: '2 Months', value: '2 months' },
  { id: '3-months', name: '3+ Months', value: '3+ months' },
  { id: 'ongoing', name: 'Ongoing', value: 'ongoing' },
] as const;

export const WORK_CURRENCIES = [
  { id: 'btc', name: 'BTC', symbol: '₿' },
  { id: 'sats', name: 'Sats', symbol: 'sats' },
  { id: 'usd', name: 'USD', symbol: '$' },
  { id: 'per-hour', name: 'Per Hour', symbol: '/hr' },
  { id: 'per-day', name: 'Per Day', symbol: '/day' },
  { id: 'per-project', name: 'Per Project', symbol: 'fixed' },
] as const;

export function getWorkCategories() {
  return WORK_CATEGORIES;
}

export function getWorkJobTypes() {
  return WORK_JOB_TYPES;
}

export function getWorkDurations() {
  return WORK_DURATIONS;
}

export function getWorkCurrencies() {
  return WORK_CURRENCIES;
}
```

**Dependencies:** None  
**Testing:** Import functions, verify they return expected arrays

---

## Phase 2: Service Layer (Bottom-Up SOA)

### 2.1 Add Work Methods to GenericEventService

**Action:** MODIFY `src/services/generic/GenericEventService.ts`  
**Pattern:** Work events use same NIP-23 structure as contributions/products  
**Status:** Not Started

**No changes needed** - `createNIP23Event()` is already generic and can handle work events.

**Verification:**
- Review `createNIP23Event()` parameters
- Confirm it supports all required tags for work events
- Test with work-specific tag structure

**Dependencies:** None  
**Testing:** Create a test work event structure, verify tag formatting

---

### 2.2 Create GenericWorkService

**Action:** CREATE `src/services/generic/GenericWorkService.ts`  
**Pattern:** Copy from `src/services/generic/GenericContributionService.ts`  
**Status:** Not Started

**Methods:**
```typescript
// Fetch public work opportunities
export async function fetchPublicWorkOpportunities(
  limit: number = 20,
  until?: number
): Promise<WorkEvent[]>

// Extract media from work event tags
export function extractMedia(tags: string[][]): WorkMediaUrls

// Parse work event from NostrEvent
export function parseWorkEvent(event: NostrEvent): WorkEvent | null
```

**Filter Structure:**
```typescript
{
  kinds: [30023],
  '#t': ['nostr-for-nomads-work'],
  limit,
  until,
}
```

**Dependencies:** 
- `src/types/work.ts` (Phase 1.1)
- `GenericRelayService.queryEvents()`

**Testing:**
- Mock Nostr events with work tags
- Verify parsing extracts all fields correctly
- Test media extraction from tags

---

### 2.3 Add Work Event Creation to NostrEventService

**Action:** MODIFY `src/services/nostr/NostrEventService.ts`  
**Pattern:** Copy from `createContributionEvent()` method  
**Status:** Not Started

**Method to Add:**
```typescript
/**
 * Create a work opportunity event (Kind 30023)
 * Uses GenericEventService.createNIP23Event for event construction
 * 
 * @param workData - Work opportunity data
 * @param signer - Nostr signer
 * @param dTag - Optional dTag for updates
 */
public async createWorkEvent(
  workData: {
    title: string;
    description: string;
    category: string;
    jobType: string;
    duration: string;
    payRate: number;
    currency: string;
    language?: string;
    location?: string;
    region: string;
    country: string;
    contact?: string;
    tags: string[];
    attachments: Array<{
      url: string;
      type: 'image' | 'video' | 'audio';
      hash?: string;
      name?: string;
      size?: number;
      mimeType?: string;
    }>;
  },
  signer: NostrSigner,
  dTag?: string
): Promise<NIP23Event>
```

**Implementation:**
1. Get pubkey from signer
2. Build markdown content (description + embedded media)
3. Create NIP23Content object
4. Build tags array with work-specific tags
5. Call `createNIP23Event()` with dTagPrefix: 'work'
6. Return signed event

**Location:** Add after `createContributionEvent()` (around line 300)

**Dependencies:**
- `src/types/work.ts` (Phase 1.1)
- `GenericEventService.createNIP23Event()`

**Testing:**
- Create test work data
- Call method with mock signer
- Verify event structure, tags, content

---

### 2.4 Create WorkValidationService

**Action:** CREATE `src/services/business/WorkValidationService.ts`  
**Pattern:** Copy from `src/services/business/ContributionValidationService.ts`  
**Status:** Not Started

**Methods:**
```typescript
export function validateWorkData(
  data: WorkData
): WorkValidationResult {
  // Validate required fields
  // Validate field lengths
  // Validate pay rate is positive
  // Validate category/jobType/currency are valid
  // Return { valid: boolean, errors: {} }
}
```

**Validation Rules:**
- Title: Required, 5-200 characters
- Description: Required, 50-5000 characters
- Category: Required, must be in WORK_CATEGORIES
- Job Type: Required, must be in WORK_JOB_TYPES
- Duration: Required, must be in WORK_DURATIONS
- Pay Rate: Required, > 0
- Currency: Required, must be in WORK_CURRENCIES
- Region: Required
- Country: Required
- Tags: Max 10 tags, each 2-50 characters

**Dependencies:**
- `src/types/work.ts` (Phase 1.1)
- `src/config/work.ts` (Phase 1.2)

**Testing:**
- Test with valid data → expect valid: true
- Test with missing required fields → expect errors
- Test with invalid values → expect specific error messages

---

### 2.5 Create WorkBusinessService

**Action:** CREATE `src/services/business/WorkBusinessService.ts`  
**Pattern:** Copy from `src/services/business/ContributionService.ts`  
**Status:** Not Started

**Methods:**

#### 2.5.1 createWork()
```typescript
export async function createWork(
  workData: WorkData,
  attachmentFiles: File[],
  signer: NostrSigner,
  existingDTag?: string,
  onProgress?: (progress: WorkPublishingProgress) => void
): Promise<CreateWorkResult>
```

**Flow:**
1. Validate work data (call WorkValidationService)
2. Upload attachments if any (call GenericBlossomService)
3. Create work event (call NostrEventService.createWorkEvent)
4. Publish to relays (call NostrEventService.publishEvent)
5. Return result with eventId, dTag, relay status

#### 2.5.2 fetchPublicWorkOpportunities()
```typescript
export async function fetchPublicWorkOpportunities(
  limit: number = 20,
  until?: number
): Promise<WorkExploreItem[]>
```

**Flow:**
1. Fetch from GenericWorkService
2. Transform to WorkExploreItem (business logic)
3. Return display-ready data

#### 2.5.3 fetchWorksByAuthor()
```typescript
export async function fetchWorksByAuthor(
  pubkey: string
): Promise<WorkEvent[]>
```

**Flow:**
1. Query relays with author filter
2. Deduplicate by dTag (NIP-33)
3. Parse events to WorkEvent[]
4. Sort by created_at descending

#### 2.5.4 deleteWork()
```typescript
export async function deleteWork(
  eventId: string,
  signer: NostrSigner,
  pubkey: string,
  title: string
): Promise<{ success: boolean; publishedRelays?: string[]; error?: string }>
```

**Flow:**
1. Create NIP-09 deletion event (GenericEventService)
2. Sign event
3. Publish to relays
4. Return result

#### 2.5.5 fetchWorkById()
```typescript
export async function fetchWorkById(
  dTag: string
): Promise<WorkEvent | null>
```

**Flow:**
1. Query relays for specific dTag
2. Get latest event (NIP-33)
3. Parse to WorkEvent
4. Return or null if not found

**Dependencies:**
- `src/types/work.ts` (Phase 1.1)
- `src/services/business/WorkValidationService.ts` (Phase 2.4)
- `src/services/nostr/NostrEventService.ts` (Phase 2.3)
- `src/services/generic/GenericWorkService.ts` (Phase 2.2)
- `src/services/generic/GenericBlossomService.ts` (existing)
- `src/services/generic/GenericEventService.ts` (existing)
- `src/services/generic/GenericRelayService.ts` (existing)

**Testing:**
- Test createWork with valid data → expect success
- Test fetchPublicWorkOpportunities → expect array of items
- Test fetchWorksByAuthor → expect user's work listings
- Test deleteWork → expect deletion event published
- Test fetchWorkById → expect specific work or null

---

## Phase 3: Hook Layer

### 3.1 Create useWorkPublishing Hook

**Action:** CREATE `src/hooks/useWorkPublishing.ts`  
**Pattern:** Copy from `src/hooks/useContributionPublishing.ts`  
**Status:** Not Started

**Structure:**
```typescript
export function useWorkPublishing() {
  const { isAvailable, getSigner } = useNostrSigner();
  const [state, setState] = useState<WorkPublishingState>(...);
  
  const { publishWithWrapper, consentDialog } = useContentPublishing<
    WorkData,
    WorkPublishingResult,
    WorkPublishingProgress
  >({
    serviceName: 'WorkBusinessService',
    methodName: 'createWork',
    isAvailable,
    getSigner,
    stateSetters,
  });
  
  const publishWork = async (
    data: WorkData,
    attachmentFiles: File[],
    existingDTag?: string
  ): Promise<WorkPublishingResult> => {
    // Call publishWithWrapper with createWork
  };
  
  const resetPublishing = () => { /* reset state */ };
  
  return {
    ...state,
    publishWork,
    resetPublishing,
    consentDialog,
  };
}
```

**Dependencies:**
- `src/types/work.ts` (Phase 1.1)
- `src/hooks/useNostrSigner.ts` (existing)
- `src/hooks/useContentPublishing.ts` (existing)
- `src/services/business/WorkBusinessService.ts` (Phase 2.5)

**Testing:**
- Mock signer, call publishWork
- Verify state updates during publishing
- Verify consent dialog integration

---

### 3.2 Create usePublicWorkOpportunities Hook

**Action:** CREATE `src/hooks/usePublicWorkOpportunities.ts`  
**Pattern:** Copy from `src/hooks/useExploreContributions.ts`  
**Status:** Not Started

**Structure:**
```typescript
export function usePublicWorkOpportunities() {
  const [opportunities, setOpportunities] = useState<WorkExploreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  
  const loadOpportunities = async (until?: number) => {
    // Fetch from WorkBusinessService
    // Append to existing list if pagination
  };
  
  const loadMore = async () => {
    // Pagination logic
  };
  
  const refresh = async () => {
    // Clear and reload
  };
  
  useEffect(() => {
    loadOpportunities();
  }, []);
  
  return {
    opportunities,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
```

**Dependencies:**
- `src/types/work.ts` (Phase 1.1)
- `src/services/business/WorkBusinessService.ts` (Phase 2.5)

**Testing:**
- Call hook, verify initial load
- Call loadMore, verify pagination
- Call refresh, verify data reload

---

### 3.3 Create useMyWorkOpportunities Hook

**Action:** CREATE `src/hooks/useMyWorkOpportunities.ts`  
**Pattern:** Similar to fetching logic in `src/app/my-contributions/page.tsx`  
**Status:** Not Started

**Structure:**
```typescript
export function useMyWorkOpportunities(pubkey?: string) {
  const [opportunities, setOpportunities] = useState<WorkEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const loadOpportunities = async () => {
    if (!pubkey) return;
    // Fetch from WorkBusinessService.fetchWorksByAuthor
  };
  
  useEffect(() => {
    loadOpportunities();
  }, [pubkey]);
  
  return {
    opportunities,
    isLoading,
    error,
    reload: loadOpportunities,
  };
}
```

**Dependencies:**
- `src/types/work.ts` (Phase 1.1)
- `src/services/business/WorkBusinessService.ts` (Phase 2.5)

**Testing:**
- Call with test pubkey, verify fetch
- Verify loading states

---

## Phase 4: Component Layer

### 4.1 Create UnifiedWorkCard Component

**Action:** CREATE `src/components/generic/UnifiedWorkCard.tsx`  
**Pattern:** Copy from `src/components/generic/UnifiedContributionCard.tsx`  
**Status:** Not Started

**Props:**
```typescript
interface UnifiedWorkCardProps {
  work: UnifiedWorkData;
  variant: 'work' | 'my-work';
  onEdit?: () => void; // Only for 'my-work' variant
  onDelete?: () => void; // Only for 'my-work' variant
}

interface UnifiedWorkData {
  id: string;
  dTag: string;
  title: string;
  description: string;
  category: string;
  jobType: string;
  duration: string;
  payRate: number;
  currency: string;
  location?: string;
  region: string;
  country?: string;
  imageUrl?: string;
  tags: string[];
  pubkey: string;
  createdAt: number;
  // Explore-specific fields
  company?: string;
  rating?: number;
  relativeTime?: string;
}
```

**Variants:**
- `work`: Public browse view (no edit/delete buttons, show "Apply" button)
- `my-work`: Management view (show edit/delete buttons)

**Dependencies:**
- `src/types/work.ts` (Phase 1.1)

**Testing:**
- Render with 'work' variant → verify no edit/delete buttons
- Render with 'my-work' variant → verify edit/delete buttons
- Test onClick handlers

---

### 4.2 Create WorkForm Component

**Action:** CREATE `src/components/pages/WorkForm.tsx`  
**Pattern:** Copy from `src/components/pages/ContributionForm.tsx`  
**Status:** Not Started

**Sections:**
1. Basic Information (title, category, job type)
2. Job Details (description, duration, location)
3. Compensation (pay rate, currency)
4. Media & Attachments (file upload)
5. Tags & Keywords

**State Management:**
- Form data state
- Validation errors
- File attachments
- Publishing progress

**Dependencies:**
- `src/types/work.ts` (Phase 1.1)
- `src/config/work.ts` (Phase 1.2)
- `src/hooks/useWorkPublishing.ts` (Phase 3.1)
- `src/hooks/useAttachmentManager.ts` (existing)

**Testing:**
- Fill form, submit → verify validation
- Upload files → verify attachment management
- Publish work → verify publishing flow

---

### 4.3 Create WorkContent Component

**Action:** CREATE `src/components/pages/WorkContent.tsx`  
**Pattern:** Similar to `src/components/pages/ContributeContent.tsx`  
**Status:** Not Started

**Purpose:** Landing page for /work/create route

**Structure:**
- Hero section (explanation of Work feature)
- CTA to post a job (opens WorkForm)
- Process steps (How to post a job)
- Benefits section
- Auth gate (require sign-in)

**Dependencies:**
- `src/components/pages/WorkForm.tsx` (Phase 4.2)
- `src/stores/useAuthStore.ts` (existing)

**Testing:**
- Render when not authenticated → show sign-in prompt
- Render when authenticated → show WorkForm
- Verify CTA interactions

---

## Phase 5: Page Layer

### 5.1 Update /work Page (Public Browse)

**Action:** MODIFY `src/app/work/page.tsx`  
**Pattern:** Copy structure from `src/app/explore/page.tsx`  
**Status:** Not Started

**Changes:**
1. Remove mock data
2. Add `usePublicWorkOpportunities()` hook
3. Replace hardcoded jobs with `opportunities` from hook
4. Add loading/error states
5. Update card rendering to use `UnifiedWorkCard` with `variant="work"`
6. Keep existing filters (category, job type, search)
7. Add "Post a Job" button → redirect to `/work/create`

**Structure:**
```tsx
export default function WorkPage() {
  const { isAuthenticated } = useAuthStore();
  const { opportunities, isLoading, error, loadMore, hasMore } = usePublicWorkOpportunities();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  
  // Filter logic
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(opp => {
      // Apply filters
    });
  }, [opportunities, searchQuery, selectedCategory, selectedType]);
  
  return (
    <div>
      {/* Header */}
      {/* Filters */}
      {/* Opportunities Grid */}
      {/* Load More */}
    </div>
  );
}
```

**Dependencies:**
- `src/hooks/usePublicWorkOpportunities.ts` (Phase 3.2)
- `src/components/generic/UnifiedWorkCard.tsx` (Phase 4.1)
- `src/stores/useAuthStore.ts` (existing)

**Testing:**
- Load page → verify opportunities fetched
- Apply filters → verify filtering logic
- Click "Load More" → verify pagination
- Click "Post a Job" → verify navigation

---

### 5.2 Create /work/create Page

**Action:** CREATE `src/app/work/create/page.tsx`  
**Pattern:** Similar to `/contribute` route  
**Status:** Not Started

**Structure:**
```tsx
import WorkContent from '@/components/pages/WorkContent';

export const metadata = {
  title: 'Post a Job | ncoin',
  description: 'Post freelance work opportunities on Nostr',
};

export default function WorkCreatePage() {
  return <WorkContent />;
}
```

**Directory:** Create `/src/app/work/create/` directory

**Dependencies:**
- `src/components/pages/WorkContent.tsx` (Phase 4.3)

**Testing:**
- Navigate to `/work/create`
- Verify WorkContent renders
- Test full job posting flow

---

### 5.3 Create /my-work Page (Manage Your Jobs)

**Action:** CREATE `src/app/my-work/page.tsx`  
**Pattern:** Copy from `src/app/my-contributions/page.tsx`  
**Status:** Not Started

**Structure:**
```tsx
'use client';

export default function MyWorkPage() {
  const { user } = useAuthStore();
  const { getSigner } = useNostrSigner();
  const { opportunities, isLoading, error, reload } = useMyWorkOpportunities(user?.pubkey);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<WorkEvent | null>(null);
  
  const handleEdit = (work: WorkEvent) => {
    router.push(`/my-work/edit/${work.dTag}`);
  };
  
  const handleDelete = async (work: WorkEvent) => {
    // Show delete confirmation
    // Call WorkBusinessService.deleteWork
    // Reload list
  };
  
  return (
    <div>
      {/* Header with "Post a Job" button */}
      {/* Statistics Dashboard */}
      {/* Filters */}
      {/* Opportunities Grid with UnifiedWorkCard variant="my-work" */}
      {/* Delete Confirmation Modal */}
    </div>
  );
}
```

**Directory:** Create `/src/app/my-work/` directory

**Features:**
- Statistics dashboard (total jobs, by category, by type)
- Search and filters
- Edit/delete functionality
- Auth gate (require sign-in)

**Dependencies:**
- `src/hooks/useMyWorkOpportunities.ts` (Phase 3.3)
- `src/components/generic/UnifiedWorkCard.tsx` (Phase 4.1)
- `src/components/generic/DeleteConfirmationModal.tsx` (existing)
- `src/services/business/WorkBusinessService.ts` (Phase 2.5)

**Testing:**
- Load page when signed in → verify user's jobs load
- Apply filters → verify filtering
- Click edit → verify navigation to edit page
- Click delete → verify deletion flow

---

### 5.4 Create /my-work/edit/[id] Page

**Action:** CREATE `src/app/my-work/edit/[id]/page.tsx`  
**Pattern:** Similar to `/my-contributions/edit/[id]` (not yet implemented in codebase)  
**Status:** Not Started

**Structure:**
```tsx
'use client';

interface EditWorkPageProps {
  params: Promise<{ id: string }>;
}

export default function EditWorkPage({ params }: EditWorkPageProps) {
  const router = useRouter();
  const [dTag, setDTag] = useState<string | null>(null);
  const [work, setWork] = useState<WorkEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    params.then(p => {
      const decoded = decodeURIComponent(p.id);
      setDTag(decoded);
    });
  }, [params]);
  
  useEffect(() => {
    if (!dTag) return;
    // Fetch work by dTag
    WorkBusinessService.fetchWorkById(dTag).then(setWork);
  }, [dTag]);
  
  if (isLoading) return <div>Loading...</div>;
  if (!work) return <div>Work not found</div>;
  
  return (
    <div>
      <h1>Edit Work Opportunity</h1>
      <WorkForm 
        initialData={work}
        existingDTag={dTag}
        onSuccess={() => router.push('/my-work')}
      />
    </div>
  );
}
```

**Directory:** Create `/src/app/my-work/edit/[id]/` directory

**Dependencies:**
- `src/services/business/WorkBusinessService.ts` (Phase 2.5)
- `src/components/pages/WorkForm.tsx` (Phase 4.2)

**Testing:**
- Navigate to edit page with valid dTag → verify work loads
- Edit form → verify updates publish correctly
- Cancel → verify navigation back to my-work

---

### 5.5 Create /work/[id] Page (Detail View)

**Action:** CREATE `src/app/work/[id]/page.tsx`  
**Pattern:** Copy from `src/app/explore/[id]/page.tsx`  
**Status:** Not Started

**Structure:**
```tsx
interface WorkDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  
  // Fetch work by dTag (server-side)
  const work = await WorkBusinessService.fetchWorkById(decodedId);
  
  if (!work) {
    return <WorkNotFound />;
  }
  
  return (
    <div>
      {/* Work Detail Display */}
      {/* Title, description, compensation */}
      {/* Media gallery */}
      {/* Apply button (opens Nostr DM or contact info) */}
      {/* Author info */}
      {/* Tags */}
    </div>
  );
}
```

**Directory:** Create `/src/app/work/[id]/` directory

**Dependencies:**
- `src/services/business/WorkBusinessService.ts` (Phase 2.5)

**Testing:**
- Navigate to work detail → verify data displays
- Click "Apply" → verify contact flow
- Verify SEO metadata

---

## Phase 6: Integration & Testing

### 6.1 Update Header Navigation

**Action:** MODIFY `src/components/Header.tsx`  
**Status:** Not Started

**Change:** Verify "Work" link points to `/work` (already exists in current code)

**Testing:** Click "Work" in header → verify navigation

---

### 6.2 Update NIP Implementation Matrix

**Action:** MODIFY `docs/nc-nip-kind-implementation-matrix.md`  
**Status:** Not Started

**Change:** Update Work row to reflect implementation status

**Before:**
```
| Work | ❌ | ❌ | ❌ | ... | Not Started |
```

**After:**
```
| Work | ✅ Query events | ❌ | ❌ | ❌ | ❌ | ✅ Long-form | ✅ Replaceable | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Work Opportunities | Production |
```

**Testing:** Review document for accuracy

---

### 6.3 End-to-End Testing Checklist

**Action:** MANUAL TESTING  
**Status:** Not Started

**Test Scenarios:**

#### 6.3.1 Public Browse (/work)
- [ ] Load /work page
- [ ] Verify work opportunities display
- [ ] Apply category filter → verify filtering
- [ ] Apply job type filter → verify filtering
- [ ] Search by keyword → verify results
- [ ] Click "Load More" → verify pagination
- [ ] Click work card → verify navigation to detail page
- [ ] Click "Post a Job" → verify navigation to create page

#### 6.3.2 Create Work (/work/create)
- [ ] Navigate to /work/create
- [ ] Not signed in → verify auth gate prompt
- [ ] Sign in → verify WorkForm displays
- [ ] Fill form with valid data
- [ ] Upload images/videos → verify attachment upload
- [ ] Submit form → verify publishing progress
- [ ] Verify success redirect to detail page or my-work
- [ ] Verify event published to relays

#### 6.3.3 Manage Work (/my-work)
- [ ] Navigate to /my-work
- [ ] Verify user's posted jobs display
- [ ] Verify statistics dashboard displays correctly
- [ ] Apply filters → verify filtering
- [ ] Search → verify results
- [ ] Click edit button → verify navigation to edit page
- [ ] Click delete button → verify confirmation modal
- [ ] Confirm delete → verify deletion event published
- [ ] Verify deleted job removed from list

#### 6.3.4 Edit Work (/my-work/edit/[id])
- [ ] Navigate to edit page
- [ ] Verify existing work data pre-fills form
- [ ] Modify fields
- [ ] Upload new media → verify attachment management
- [ ] Submit → verify update publishes (NIP-33 replacement)
- [ ] Verify redirect to my-work
- [ ] Verify updated work displays on /work

#### 6.3.5 Work Detail (/work/[id])
- [ ] Navigate to work detail page
- [ ] Verify all work data displays
- [ ] Verify media gallery works
- [ ] Click "Apply" → verify contact flow (DM or external)
- [ ] Verify SEO metadata

#### 6.3.6 Build & Deploy
- [ ] Run `npm run build` (full, no piping)
- [ ] Verify NO compile errors
- [ ] Fix all errors before proceeding
- [ ] Commit and push to GitHub
- [ ] Verify Vercel deployment succeeds
- [ ] Test on https://nostrcoin.vercel.app

---

## Phase 7: Documentation & Completion

### 7.1 Update README (if needed)

**Action:** MODIFY `README.md` (only if explicitly requested)  
**Status:** Not Started

**Potential Update:** Add Work feature to features list

---

### 7.2 Mark Implementation Complete

**Action:** UPDATE this document  
**Status:** Not Started

**Change:** Update status to "Complete" and add completion date

---

## Implementation Order Summary

**Critical: Follow this exact sequence to adhere to SOA guidelines**

1. **Phase 1: Foundation** (Types & Config)
   - 1.1 Create `src/types/work.ts`
   - 1.2 Create `src/config/work.ts`

2. **Phase 2: Service Layer** (Bottom-Up)
   - 2.1 Verify GenericEventService (no changes needed)
   - 2.2 Create `src/services/generic/GenericWorkService.ts`
   - 2.3 Add `createWorkEvent()` to `src/services/nostr/NostrEventService.ts`
   - 2.4 Create `src/services/business/WorkValidationService.ts`
   - 2.5 Create `src/services/business/WorkBusinessService.ts`

3. **Phase 3: Hook Layer**
   - 3.1 Create `src/hooks/useWorkPublishing.ts`
   - 3.2 Create `src/hooks/usePublicWorkOpportunities.ts`
   - 3.3 Create `src/hooks/useMyWorkOpportunities.ts`

4. **Phase 4: Component Layer**
   - 4.1 Create `src/components/generic/UnifiedWorkCard.tsx`
   - 4.2 Create `src/components/pages/WorkForm.tsx`
   - 4.3 Create `src/components/pages/WorkContent.tsx`

5. **Phase 5: Page Layer**
   - 5.1 Update `src/app/work/page.tsx`
   - 5.2 Create `src/app/work/create/page.tsx`
   - 5.3 Create `src/app/my-work/page.tsx`
   - 5.4 Create `src/app/my-work/edit/[id]/page.tsx`
   - 5.5 Create `src/app/work/[id]/page.tsx`

6. **Phase 6: Integration & Testing**
   - 6.1 Verify Header navigation
   - 6.2 Update NIP Implementation Matrix
   - 6.3 End-to-End Testing

7. **Phase 7: Documentation**
   - 7.1 Update README (if requested)
   - 7.2 Mark complete

---

## Critical Guidelines Adherence Checklist

- [x] Follows SOA architecture (Page → Component → Hook → Business Service → Event Service → Generic Service)
- [x] Reuses existing services (GenericEventService, GenericRelayService, GenericBlossomService)
- [x] Uses NIP-23 (Kind 30023) parameterized replaceable events
- [x] Uses established tag pattern: `['t', 'nostr-for-nomads-work']`
- [x] Uses `dTagPrefix: 'work'` for unique identifiers
- [x] Implements full CRUD (Create, Read, Update, Delete)
- [x] Uses unified card component pattern with variants
- [x] Includes validation service
- [x] Uses generic content publishing wrapper for file uploads
- [x] Includes progress tracking and error handling
- [x] Implements NIP-09 deletion events
- [x] Handles NIP-33 deduplication
- [x] Includes comprehensive testing steps
- [x] Follows build → test → commit → push → verify workflow

---

## Notes

- **Architecture Theater Prevention:** Each phase requires testing before proceeding
- **No Shortcuts:** Follow SOA layers strictly
- **Reuse First:** Check existing services before creating new ones
- **Test Before Commit:** `npm run build` must succeed (no piping)
- **User Verification:** Test on production (nostrcoin.vercel.app) after deployment
- **Documentation:** Update as you go, not after completion

---

**Status:** Ready for Implementation  
**Next Action:** Begin Phase 1.1 - Create `src/types/work.ts`
