# My Contributions Feature - Implementation Plan

**Goal**: Implement complete CRUD cycle for user contributions (Create ✅, Read ✅, Update ❌, Delete ❌)

**Strategy**: Copy and adapt from `/temp-cb-reference` vs building from scratch

**Validation Status**: ✅ **CRITICAL VALIDATION COMPLETE** - All planned files/methods verified to not exist

---

## ⚠️ VALIDATION RESULTS - DEEP DIVE COMPLETE

### ✅ Safe to Create (No Conflicts - Triple Verified)

**Service Methods** (ContributionService.ts):
- ✅ `fetchContributionsByAuthor(pubkey)` - **DOES NOT EXIST** (verified in service file)
- ✅ `fetchContributionById(dTag)` - **DOES NOT EXIST** (verified in service file)
- ✅ `deleteContribution()` - **DOES NOT EXIST** (verified in service file)

**Deletion Infrastructure** (GenericEventService.ts):
- ✅ `createDeletionEvent()` - **EXISTS** at lines 509-570
- ✅ Creates NIP-09 Kind 5 deletion events
- ✅ Accepts `eventIdsToDelete[]`, `userPubkey`, optional `reason` and `additionalTags`
- ✅ Returns `EventCreationResult` with unsigned event

**Type Definitions** (contributions.ts):
- ✅ `ContributionCardData` interface - **DOES NOT EXIST** (file exists, interface missing)
- ✅ File has all form/validation types, missing display/card types

**Components**:
- ✅ `MyContributionCard.tsx` - **DOES NOT EXIST** (verified via file_search)
- ✅ `DeleteConfirmationModal.tsx` - **DOES NOT EXIST** (verified via file_search)

**Pages**:
- ✅ `/app/my-contributions/page.tsx` - **DOES NOT EXIST** (verified via file_search)
- ✅ `/app/my-contributions/edit/[id]/page.tsx` - **DOES NOT EXIST** (verified via grep)
- ✅ No edit mode in any existing pages (verified via grep for "editMode|isEditMode")
- ✅ `/app/my-contributions/` directory - **DOES NOT EXIST** (verified via file_search)

**Navigation**:
- ✅ No `/my-contributions` links in Header.tsx (verified by reading full file)
- ✅ Header shows auth-gated pattern (authenticated users see different menu)
- ✅ Mobile menu already implements user profile section pattern

**Config**:
- ✅ `/config/contributions.ts` - **EXISTS** with all needed exports (verified by reading)
- ✅ `CONTRIBUTION_TYPES` array - **EXISTS** (6 types: experience, tutorial, review, tip, story, resource)
- ✅ `NOMAD_CATEGORIES` array - **EXISTS** (13 categories)
- ✅ `getNomadCategories()` function - **EXISTS** (alias for NOMAD_CATEGORIES)
- ✅ `REGIONS` and `COUNTRIES` - **EXISTS** (comprehensive lists)

### 📋 Existing Resources We Can Use

**Services:**
1. **ContributionService.ts** - Has `createContribution()` with `existingDTag` support for updates ✅
2. **GenericContributionService.ts** - Has `fetchPublicContributions()` with Kind 30023 queries ✅
3. **GenericEventService.ts** - Has `createDeletionEvent()` for NIP-09 deletions ✅
4. **NostrEventService.ts** - Has `createContributionEvent()` and `publishEvent()` ✅

**Types:**
5. **contributions.ts** - Has all form types, validation types, event types ✅
6. **config/contributions.ts** - Has all categories, types, regions, countries ✅

**Infrastructure:**
7. **Header.tsx** - Already has auth-gated navigation pattern (lines 153-290) ✅
8. **GenericRelayService** - Has `queryEvents()` for relay queries ✅

### 🎯 Implementation Confidence: VERY HIGH

**Zero Conflicts:**
- ✅ No duplicate methods detected (verified via grep across all services)
- ✅ No duplicate components detected (verified via file_search)
- ✅ No duplicate pages detected (verified via file_search and grep)
- ✅ No duplicate types detected (verified by reading type files)
- ✅ No duplicate config detected (verified by reading config file)

**Existing Patterns:**
- ✅ Update already works via `createContribution(data, files, signer, existingDTag)`
- ✅ Delete pattern available via `GenericEventService.createDeletionEvent()`
- ✅ Auth-gated nav pattern exists in Header.tsx (lines 275-290)
- ✅ Query by author pattern available (need to adapt from fetchPublicContributions)

**Critical Finding - Update Function:**
- ⚠️ Phase 1.4 can be **REMOVED** - Update already implemented in `createContribution()`
- ✅ No changes needed to existing update logic

**Critical Finding - fetchById Pattern:**
- ✅ Reference implementation in temp-cb-reference (lines 600-700)
- ✅ Uses `queryEvents()` with `#d` tag filter for parameterized replaceable events
- ✅ Sorts by `created_at DESC` to get latest version
- ✅ Parses imeta tags for full media metadata

---

## 🛡️ SOA COMPLIANCE GUARANTEES

### Architectural Rules Enforcement

**Service Layer Separation (NON-NEGOTIABLE):**
```text
✅ CORRECT FLOW:
Page → Component → Hook → Business Service → Generic Service → Relay Service

❌ FORBIDDEN:
Hook → Manual event building
Component → Direct relay calls
Page → Bypassing business logic
```

**Implementation Validation Checklist:**

**Phase 1 - Service Layer:**
- ✅ All methods in `ContributionService.ts` (Business Layer)
- ✅ Use `GenericEventService.createDeletionEvent()` for deletions (no manual building)
- ✅ Use `GenericRelayService.queryEvents()` for queries (no direct relay access)
- ✅ Use `NostrEventService.publishEvent()` for publishing (no bypass)
- ❌ FORBIDDEN: Building events in hooks/components
- ❌ FORBIDDEN: Direct relay communication outside service layer

**Phase 2 - Type Safety:**
- ✅ All types in `/src/types/contributions.ts` (no inline types)
- ✅ Reuse existing types where possible
- ❌ FORBIDDEN: Any types in components/hooks

**Phase 3 - Component Purity:**
- ✅ Components are presentation-only (no business logic)
- ✅ All state management via hooks
- ❌ FORBIDDEN: Service calls from components
- ❌ FORBIDDEN: Event building in components

**Phase 4 - Page Orchestration:**
- ✅ Pages coordinate components + hooks only
- ✅ Use existing hooks pattern (useAuthStore, useContributionPublishing)
- ❌ FORBIDDEN: Business logic in pages
- ❌ FORBIDDEN: Direct service calls from pages

**Phase 5 - Navigation:**
- ✅ Auth-gated using existing `isAuthenticated` pattern
- ✅ Follow Header.tsx pattern (lines 153-290)
- ❌ FORBIDDEN: Custom auth logic

### Code Reuse Enforcement

**Mandatory Reuse (DO NOT DUPLICATE):**
1. `GenericEventService.createDeletionEvent()` - for Kind 5 deletion events ✅
2. `GenericRelayService.queryEvents()` - for relay queries ✅
3. `NostrEventService.publishEvent()` - for event publishing ✅
4. `useAuthStore` - for authentication state ✅
5. `CONTRIBUTION_TYPES`, `getNomadCategories()` - from config ✅
6. Existing validation patterns from `ContributionValidationService` ✅

**Pattern Reuse (STUDY THESE):**
1. **Shop Pattern** - for CRUD operations reference
2. **Header.tsx** - for auth-gated navigation (lines 153-290)
3. **ContributionService.createContribution()** - for update pattern (existingDTag param)
4. **temp-cb-reference fetchHeritageById** - for query by dTag pattern (lines 600-700)

### Testing & Verification Requirements

**Definition of "Complete" for My Contributions:**

**Phase 1 Complete:**
- ✅ `npm run build` succeeds with new service methods
- ✅ Methods return proper types (not any/unknown)
- ✅ Logging added to all service methods
- ✅ Error handling uses AppError pattern

**Phase 2 Complete:**
- ✅ Types compile without errors
- ✅ No circular dependencies introduced
- ✅ Types match service return types

**Phase 3 Complete:**
- ✅ Components render without errors
- ✅ PropTypes validated
- ✅ Accessibility verified (keyboard nav, ARIA)

**Phase 4 Complete:**
- ✅ Dashboard loads contributions by author
- ✅ Statistics calculate correctly
- ✅ Filters work (search, type, category)
- ✅ Edit navigates with correct dTag
- ✅ Delete publishes Kind 5 event with NIP-09 compliance
- ✅ Edit page loads contribution data
- ✅ Edit page verifies ownership (pubkey match)
- ✅ Update uses existing `createContribution()` with existingDTag

**Phase 5 Complete:**
- ✅ Link shows only when authenticated
- ✅ Link hidden when not authenticated
- ✅ Navigation functional on desktop + mobile

**Phase 7 Complete (End-to-End):**
- ✅ User creates contribution → appears in my-contributions
- ✅ User edits contribution → updates appear
- ✅ User deletes contribution → disappears from list + Kind 5 published
- ✅ Ownership verified (can't edit others' contributions)
- ✅ Tested on https://nostrcoin.vercel.app (not localhost)

**Phase 8 Complete:**
- ✅ NIP matrix updated with NIP-09 status
- ✅ README updated with My Contributions feature
- ✅ All changes committed with proper message format

### Anti-Pattern Prevention

**RED FLAGS - STOP IMMEDIATELY IF:**
- 🚩 Writing event creation logic in hook (use service layer)
- 🚩 Querying relays directly from component (use service layer)
- 🚩 Creating new tag patterns (use existing 'nostr-for-nomads-contribution')
- 🚩 Duplicating GenericEventService logic (reuse it)
- 🚩 Building without testing each phase
- 🚩 Marking complete without user verification

**MANDATORY QUESTIONS BEFORE EACH PHASE:**
1. **Does this violate SOA?** → If yes, redesign
2. **Can I reuse existing code?** → Grep first, then code
3. **Is this the shop pattern?** → Follow shop, don't deviate
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

## Phase 1: Service Layer Enhancement

### 1.1 Update ContributionService with Author Query Function
- **File**: `/src/services/business/ContributionService.ts`
- **Action**: ADD new function
- **Copy from**: `/temp-cb-reference/src/services/business/HeritageContentService.ts` (lines 880-980)
- **Function**: `fetchContributionsByAuthor(pubkey: string)`
- **Details**:
  - Query relays for Kind 30023 with author filter
  - Use tag filter: `#t: ['nostr-for-nomads-contribution']`
  - Return `ContributionEvent[]` (adapt from HeritageContribution)
  - Handle NIP-33 parameterized replaceable events
  - Parse imeta tags for media metadata
  - Sort by created_at descending

### 1.2 Add Delete Contribution Function
- **File**: `/src/services/business/ContributionService.ts`
- **Action**: ADD new function
- **Copy from**: Generic pattern using GenericEventService
- **Function**: `deleteContribution(eventId: string, signer: NostrSigner, pubkey: string, title: string)`
- **Details**:
  - Use `GenericEventService.createDeletionEvent()`
  - Create Kind 5 deletion event (NIP-09)
  - Add reason tag with contribution title
  - Sign event with signer
  - Publish to relays via `publishEvent()`
  - Return success/failure with relay stats

### 1.3 Add Fetch Contribution By ID Function

- **File**: `/src/services/business/ContributionService.ts`
- **Action**: ADD new function (MISSING - needed for edit page)
- **Copy from**: `/temp-cb-reference/src/services/business/HeritageContentService.ts` (fetchHeritageById at lines 600-700)
- **Function**: `fetchContributionById(dTag: string)`
- **Details**:
  - Query relays for Kind 30023 with `#d: [dTag]` filter
  - Use tag filter: `#t: ['nostr-for-nomads-contribution']`
  - Sort by `created_at DESC` to get latest version (NIP-33)
  - Parse imeta tags for full media metadata with `createMediaItemsFromImeta()`
  - Clean legacy content with `cleanLegacyContent(rawDescription, title)`
  - Return `ContributionEvent` or null

### 1.4 ~~Update Contribution Update Function~~

- **Status**: ✅ **NO CHANGES NEEDED**
- **Reason**: `createContribution()` already supports updates via `existingDTag` parameter
- **Verified**: Lines 30-45 in ContributionService.ts show update support
- **Action**: SKIP THIS PHASE - Remove from implementation

---

## Phase 2: Type Definitions

### 2.1 Add Contribution Card Data Type
- **File**: `/src/types/contributions.ts`
- **Action**: ADD new interface
- **Copy from**: `/temp-cb-reference/src/components/heritage/HeritageCard.tsx` (HeritageCardData interface)
- **Interface**: `ContributionCardData`
- **Fields**:
  ```typescript
  {
    id: string;           // dTag
    dTag: string;
    title: string;
    description: string;
    contributionType: string;
    category: string;
    location: string;
    region: string;
    country?: string;
    imageUrl?: string;    // First media URL
    tags: string[];
    pubkey: string;       // Author for ownership check
  }
  ```

---

## Phase 3: Components

### 3.1 Create MyContributionCard Component
- **File**: `/src/components/generic/MyContributionCard.tsx` (NEW)
- **Copy from**: `/temp-cb-reference/src/components/heritage/MyContributionCard.tsx`
- **Adapt**:
  - Change HeritageCardData → ContributionCardData
  - Update color coding for contribution types (not heritage types)
  - Update view link: `/heritage/{dTag}` → `/explore/{dTag}`
  - Keep actions: View, Edit, Delete buttons
  - Update logging service calls
- **Props**:
  ```typescript
  {
    contribution: ContributionCardData;
    onEdit: (contribution: ContributionCardData) => void;
    onDelete: (contribution: ContributionCardData) => void;
  }
  ```

### 3.2 Create DeleteConfirmationModal Component
- **File**: `/src/components/generic/DeleteConfirmationModal.tsx` (NEW)
- **Copy from**: `/temp-cb-reference/src/components/heritage/DeleteConfirmationModal.tsx`
- **Adapt**:
  - Keep as-is (already generic)
  - No changes needed (pure UI component)
- **Props**:
  ```typescript
  {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message?: string;
    isDeleting?: boolean;
  }
  ```

---

## Phase 4: Pages

### 4.1 Create My Contributions Dashboard Page
- **File**: `/src/app/my-contributions/page.tsx` (NEW)
- **Copy from**: `/temp-cb-reference/src/app/my-contributions/page.tsx`
- **Adapt**:
  - Import from ncoin's service paths
  - Change `fetchHeritageByAuthor` → `fetchContributionsByAuthor`
  - Change `deleteHeritageContribution` → `deleteContribution`
  - Update heritage terminology → contribution terminology
  - Update routes: `/heritage/` → `/explore/`
  - Use `CONTRIBUTION_TYPES` config (not HERITAGE_TYPES)
  - Use `getContributionCategories()` (adapt from heritage)
- **Features**:
  - Authentication check with redirect
  - Statistics dashboard (total, by type, by category)
  - Filter panel (search, type, category)
  - Grid display with MyContributionCard
  - Edit/Delete handlers
  - Loading/error states
  - Empty states (no contributions, no filter results)
  - DeleteConfirmationModal integration

### 4.2 Create Edit Contribution Page
- **File**: `/src/app/my-contributions/edit/[id]/page.tsx` (NEW)
- **Copy from**: `/temp-cb-reference/src/app/my-contributions/edit/[id]/page.tsx`
- **Adapt**:
  - Change `fetchHeritageById` → `fetchContributionById` (or use existing service)
  - Change `HeritageContributionForm` → existing contribution form component
  - Map contribution data to form defaultValues
  - Convert media to GenericAttachment format
  - Add ownership verification (pubkey match)
  - Redirect to `/my-contributions` after success
- **Features**:
  - Load contribution by dTag
  - Check user ownership
  - Reuse ContributeContent form in edit mode
  - Handle attachment conversion
  - Auto-redirect after 1.5 seconds

---

## Phase 5: Navigation & Routes

### 5.1 Add My Contributions Link to Header
- **File**: `/src/components/Header.tsx`
- **Action**: UPDATE navigation
- **Add**: Link to `/my-contributions`
- **Placement**: After "Contribute" or in user dropdown menu
- **Conditional**: Only show when authenticated

### 5.2 Add Layout File (Optional)
- **File**: `/src/app/my-contributions/layout.tsx` (NEW - OPTIONAL)
- **Copy from**: `/temp-cb-reference/src/app/my-contributions/layout.tsx` (if exists)
- **Or**: Use default Next.js layout inheritance

---

## Phase 6: Configuration

### 6.1 ✅ Config Already Complete - No Changes Needed

- **File**: `/src/config/contributions.ts`
- **Status**: ✅ **VERIFIED** - All needed exports exist
- **Available**:
  - `CONTRIBUTION_TYPES` (6 types) ✅
  - `NOMAD_CATEGORIES` (13 categories) ✅
  - `getNomadCategories()` function ✅
  - `REGIONS` (7 regions) ✅
  - `COUNTRIES` (195 countries) ✅
  - Helper functions: `getContributionTypeById()`, `getCategoryById()`, etc. ✅
- **Action**: SKIP THIS PHASE - No changes needed

---

## Phase 7: Testing & Verification

### 7.1 Build Test
- **Command**: `npm run build`
- **Verify**: No TypeScript errors
- **Fix**: Any type mismatches or import errors

### 7.2 Manual Testing Checklist
- [ ] Navigate to `/my-contributions` (authenticated)
- [ ] See statistics dashboard with correct counts
- [ ] Filter by search query
- [ ] Filter by contribution type
- [ ] Filter by category
- [ ] Clear filters button works
- [ ] Click "View" opens detail page in new tab
- [ ] Click "Edit" navigates to edit page
- [ ] Edit page loads contribution data
- [ ] Edit page shows ownership error if not owner
- [ ] Update contribution successfully
- [ ] Redirect to my-contributions after update
- [ ] Click "Delete" opens confirmation modal
- [ ] Cancel delete closes modal
- [ ] Confirm delete publishes NIP-09 event
- [ ] Deleted contribution removed from list
- [ ] Empty state shows for no contributions
- [ ] Filtered empty state shows "no matches"
- [ ] Loading states display correctly
- [ ] Error states display with retry option

### 7.3 Nostr Event Verification
- [ ] Query relays for contributions by author pubkey
- [ ] Verify Kind 30023 events returned
- [ ] Verify `#t` tag includes `nostr-for-nomads-contribution`
- [ ] Update creates new event with same dTag
- [ ] Delete publishes Kind 5 event with correct reference
- [ ] Deleted contributions no longer appear in queries

---

## Phase 8: Documentation

### 8.1 Update NIP Implementation Matrix
- **File**: `/docs/nip-kind-implementation-matrix.md`
- **Action**: UPDATE
- **Add**: My Contributions to production features
- **Document**: NIP-09 deletion implementation
- **Update**: Kind 5 status to "in use"

### 8.2 Update README
- **File**: `/README.md`
- **Action**: UPDATE
- **Add**: My Contributions to feature list
- **Document**: User contribution management capabilities

---

## Implementation Order (Recommended)

1. **Service Layer** (Phase 1.1-1.3) - Add 3 missing service methods
   - `fetchContributionsByAuthor()` 
   - `deleteContribution()`
   - `fetchContributionById()`
   - Skip 1.4 (update already works)

2. **Type Definitions** (Phase 2.1) - Add `ContributionCardData` interface only

3. **Components** (Phase 3.1-3.2) - Create 2 new components
   - `MyContributionCard.tsx`
   - `DeleteConfirmationModal.tsx`

4. **Pages** (Phase 4.1-4.2) - Create 2 new pages
   - Dashboard: `/app/my-contributions/page.tsx`
   - Edit: `/app/my-contributions/edit/[id]/page.tsx` (or redirect pattern)

5. **Navigation** (Phase 5.1) - Add one link to Header (skip 5.2 layout if not needed)

6. **Config** (Phase 6) - Skip entirely (already complete)

7. **Build & Test** (Phase 7.1) - Verify compilation

8. **Manual Testing** (Phase 7.2) - End-to-end verification

9. **Nostr Verification** (Phase 7.3) - Protocol compliance

10. **Documentation** (Phase 8) - Update NIP matrix and README

---

## Files Summary

### New Files (7)
1. `/src/components/generic/MyContributionCard.tsx`
2. `/src/components/generic/DeleteConfirmationModal.tsx`
3. `/src/app/my-contributions/page.tsx`
4. `/src/app/my-contributions/edit/[id]/page.tsx`
5. `/src/app/my-contributions/layout.tsx` (optional)
6. `/src/config/contributions.ts` (if doesn't exist)
7. `/docs/my-contributions-implementation-plan.md` (this file)

### Modified Files (4)
1. `/src/services/business/ContributionService.ts` - Add fetch by author & delete
2. `/src/types/contributions.ts` - Add ContributionCardData interface
3. `/src/components/Header.tsx` - Add navigation link
4. `/docs/nip-kind-implementation-matrix.md` - Update feature status
5. `/README.md` - Document new feature

### Reference Files (Copy/Adapt From)
1. `/temp-cb-reference/src/app/my-contributions/page.tsx`
2. `/temp-cb-reference/src/app/my-contributions/edit/[id]/page.tsx`
3. `/temp-cb-reference/src/components/heritage/MyContributionCard.tsx`
4. `/temp-cb-reference/src/components/heritage/DeleteConfirmationModal.tsx`
5. `/temp-cb-reference/src/services/business/HeritageContentService.ts`

---

## Key Adaptations Required

### Terminology Changes
- `heritage` → `contribution`
- `HeritageContribution` → `ContributionEvent`
- `heritageType` → `contributionType`
- `regionOrigin` → `region`

### Route Changes
- `/heritage/{dTag}` → `/explore/{dTag}`
- New: `/my-contributions`
- New: `/my-contributions/edit/{dTag}`

### Tag Changes
- `nostr-for-nomads-contribution` (updated from legacy `culture-bridge-heritage-contribution`)

### Config Changes
- `HERITAGE_TYPES` → `CONTRIBUTION_TYPES`
- `getHeritageCategories()` → `getContributionCategories()`

---

## Success Criteria

✅ User can view all their contributions in a dashboard
✅ User can filter/search their contributions
✅ User can see statistics about their contributions
✅ User can edit their contributions
✅ User can delete their contributions (NIP-09)
✅ Ownership is verified before edit/delete
✅ All operations publish to Nostr relays
✅ Build succeeds with no errors
✅ SOA architecture maintained
✅ Documentation updated

---

**Estimated Implementation Time**: 3-4 hours (with copy/adapt strategy, reduced from 4-6)
**Complexity**: Medium-Low (mostly adaptation, no net-new patterns)
**Risk**: Very Low (proven patterns, existing infrastructure, zero conflicts)
