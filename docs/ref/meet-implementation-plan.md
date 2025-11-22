# Meet Feature - Implementation Plan

**Goal**: Implement complete CRUD cycle for meetup calendar events (Create, Read, Update, Delete)

**Strategy**: Leverage NIP-52 calendar event specification + adapt established Shop/Contributions patterns

**Implementation Status**: ⏳ **NOT STARTED (0%)** - Planning phase complete

**Last Updated**: November 26, 2025

---

## 📋 Implementation Overview

This document outlines the comprehensive, step-by-step implementation of the Meet feature using NIP-52 calendar events (Kind 31923). Unlike Shop/Contributions which use NIP-23 long-form content (Kind 30023), Meet events use specialized calendar event kinds with RSVP support.

**Critical Principles:**
- ✅ Follow SOA (Service-Oriented Architecture) strictly
- ✅ Reuse existing services (GenericEventService, GenericRelayService)
- ✅ Use NIP-52 (Kind 31923) calendar events - **NOT NIP-23**
- ✅ Use tag system: `['t', 'nostr-for-nomads-meetup']`
- ✅ Support RSVP system (Kind 31925)
- ✅ Test each step before proceeding
- ✅ Build incrementally, verify continuously

---

## 🔍 NIP-52 Calendar Events Specification

### Event Kinds
- **Kind 31922**: Date-based calendar event (specific date)
- **Kind 31923**: Time-based calendar event (specific date + time) ← **WE USE THIS**
- **Kind 31924**: Calendar entry (general calendar item)
- **Kind 31925**: Calendar event RSVP (attendance responses)

### Required Tags for Kind 31923
- `['d', unique_identifier]` - NIP-33 parameterized replaceable event identifier
- `['t', 'nostr-for-nomads-meetup']` - Discovery tag (our system tag)
- `['name', event_name]` - Event title
- `['start', unix_timestamp]` - Start time (seconds since epoch)
- `['end', unix_timestamp]` - End time (optional)
- `['location', location_string]` - Physical location OR "Virtual"
- `['g', geohash]` - Geohash for map coordinates (optional)
- `['p', pubkey, relay_url, role]` - Participants/hosts (optional, multiple allowed)

### Optional Tags
- `['image', url]` - Event image
- `['description', text]` - Short description
- `['summary', text]` - Brief summary
- `['t', user_tag]` - User-defined tags (multiple)

### Content Field
- Plain text or markdown description (detailed event information)

### RSVP System (Kind 31925)
Participants respond with Kind 31925 events (NIP-33 parameterized replaceable):
- `['d', 'rsvp:${eventDTag}']` - **Deterministic dTag** for replaceability (user can update RSVP)
- `['a', '31923:${eventPubkey}:${eventDTag}']` - **Canonical reference** to calendar event (exact format required)
- `['e', event_id]` - Optional: specific event snapshot reference
- `['status', 'accepted' | 'declined' | 'tentative']` - RSVP status
- `['p', event_creator_pubkey]` - Event creator

**RSVP Replaceability (NIP-33):**
- Each user can only have ONE active RSVP per meetup (enforced by deterministic dTag)
- When user changes RSVP status, client publishes new event with same dTag
- Relays automatically replace old RSVP with new one (NIP-33 semantics)
- Clients must deduplicate: group by dTag, sort by `created_at` DESC, take latest

**RSVP Deletion:**
- To delete RSVP: publish Kind 5 deletion event
- Deletion event must reference ALL event IDs for the dTag across relays
- Process:
  1. Query all relays for Kind 31925 with `#d` = `rsvp:${eventDTag}` and author = user's pubkey
  2. Collect all event IDs returned (may differ across relays)
  3. Publish Kind 5 with `['e', eventId1]`, `['e', eventId2]`, etc. for each found event ID
  4. Add `['k', '31925']` tag to specify deleted event kind
  5. Add reason: "RSVP cancelled for ${meetupName}"

**Canonical 'a' Tag Format:**
- **Format**: `31923:${eventPubkey}:${eventDTag}` (colon-separated, no spaces)
- **eventPubkey**: Meetup creator's hex pubkey (64 characters)
- **eventDTag**: Meetup's dTag value from `['d', ...]` tag
- Both clients and server must use EXACT same string formatting
- Example: `31923:abc123...def456:meetup-1732233600-x7k9m`

**Key Difference from Shop/Contributions:**
- Shop/Contributions: Use Kind 30023 (NIP-23 long-form)
- Meet: Uses Kind 31923 (NIP-52 calendar event)
- Meet has time-based indexing + RSVP system

---

## ⚠️ VALIDATION RESULTS - INFRASTRUCTURE AUDIT

### ✅ Existing Infrastructure (Partial Reuse)

**GenericEventService.ts** - Core Event Operations:
- ✅ `signEvent()` - Event signing (reusable)
- ❌ `createCalendarEvent()` - **DOES NOT EXIST** (need to create)
- ❌ No NIP-52 calendar event support (only NIP-23)

**GenericRelayService.ts** - Query/Publish:
- ✅ `queryEvents(filters)` - Multi-relay queries (reusable)
- ✅ `publishEvent(event, signer)` - Multi-relay publishing (reusable)

**Tag System**:
- ⚠️ Discovery tag: `nostr-for-nomads-meetup` (new, doesn't exist)
- ✅ Filter ready: `/src/utils/tagFilter.ts` can be extended

### ❌ Missing Implementation (Full Stack)

**Service Methods** (Need to create):
- ❌ `GenericEventService.createCalendarEvent()` - NIP-52 Kind 31923 builder
- ❌ `GenericEventService.createRSVPEvent()` - NIP-52 Kind 31925 RSVP
- ❌ `MeetService.createMeetup()` - Business layer orchestration
- ❌ `MeetService.fetchPublicMeetups()` - Browse meetups
- ❌ `MeetService.fetchMeetupsByAuthor()` - User's meetups
- ❌ `MeetService.fetchMeetupById()` - Single meetup for edit
- ❌ `MeetService.deleteMeetup()` - NIP-09 deletion
- ❌ `MeetService.createRSVP()` - RSVP to event
- ❌ `MeetService.fetchRSVPs()` - Get event attendees

**Type Definitions** (Need to create):
- ❌ `MeetupData` interface (form data)
- ❌ `MeetupEvent` interface (Nostr event)
- ❌ `MeetupCardData` interface (display data)
- ❌ `RSVPData` interface (RSVP data)
- ❌ `MeetupPublishingResult` interface
- ❌ `MeetupPublishingState` interface
- ❌ `MeetupPublishingProgress` interface

**Components** (Need to create):
- ❌ `MyMeetupCard.tsx` - Meetup card for My Meet dashboard
- ❌ `MeetupCard.tsx` - Public browse meetup card
- ❌ `MeetupForm.tsx` - Create/edit meetup form
- ❌ `MeetContent.tsx` - Browse meetups page
- ❌ `RSVPButton.tsx` - RSVP button component
- ❌ `AttendeesList.tsx` - List of attendees

**Pages** (Need to create):
- ❌ `/app/meet/page.tsx` - **EXISTS but mock data** (needs Nostr integration)
- ❌ `/app/my-meet/page.tsx` - My meetups dashboard
- ❌ `/app/my-meet/create/page.tsx` - Create meetup page
- ❌ `/app/my-meet/edit/[id]/page.tsx` - Edit meetup page
- ❌ `/app/meet/[id]/page.tsx` - Meetup detail page
- ❌ `/app/my-meet/rsvps/page.tsx` - My RSVPs page (meetups user has RSVP'd to)

**Hooks** (Need to create):
- ❌ `useMeetPublishing.ts` - Meetup publishing logic
- ❌ `useMeetupEditing.ts` - Meetup editing logic
- ❌ `usePublicMeetups.ts` - Browse meetups logic
- ❌ `useMyMeetups.ts` - User's meetups logic
- ❌ `useRSVP.ts` - RSVP management
- ❌ `useMyRSVPs.ts` - Fetch user's RSVP history

**Navigation**:
- ✅ `/meet` link exists in Header.tsx (but needs auth-gated My Meet link)

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
- ✅ All methods in `MeetService.ts` (Business Layer)
- ✅ Create `GenericEventService.createCalendarEvent()` for Kind 31923 events
- ✅ Create `GenericEventService.createRSVPEvent()` for Kind 31925 events
- ✅ Use `GenericEventService.createDeletionEvent()` for deletions
- ✅ Use `GenericRelayService.queryEvents()` for queries
- ✅ Use `GenericEventService.signEvent()` for signing
- ❌ FORBIDDEN: Building events in hooks/components
- ❌ FORBIDDEN: Direct relay communication outside service layer

**Phase 2 - Type Safety:**
- ✅ All types in `/src/types/meetup.ts` (no inline types)
- ❌ FORBIDDEN: Any types in components/hooks

**Phase 3 - Component Purity:**
- ✅ Components are presentation-only (no business logic)
- ✅ All state management via hooks
- ❌ FORBIDDEN: Service calls from components
- ❌ FORBIDDEN: Event building in components

**Phase 4 - Page Orchestration:**
- ✅ Pages coordinate components + hooks only
- ✅ Use existing hooks pattern (useAuthStore, useMeetPublishing)
- ❌ FORBIDDEN: Business logic in pages
- ❌ FORBIDDEN: Direct service calls from pages

**Phase 5 - Navigation:**
- ✅ Auth-gated using existing `isAuthenticated` pattern
- ✅ Follow Header.tsx pattern
- ❌ FORBIDDEN: Custom auth logic

### Code Reuse Enforcement

**Mandatory Reuse (DO NOT DUPLICATE):**
1. `GenericEventService.createDeletionEvent()` - for Kind 5 deletion events ✅
2. `GenericRelayService.queryEvents()` - for relay queries ✅
3. `GenericEventService.signEvent()` - for event signing ✅
4. `useAuthStore` - for authentication state ✅
5. `DeleteConfirmationModal` - from generic components ✅

**Pattern Reuse (STUDY THESE):**
1. **Shop Pattern** - for My Meet dashboard (EXACT structure)
2. **Contributions Pattern** - for service layer (fetch/delete/update)
3. **Header.tsx auth-gated navigation** - for My Meet link

### Testing & Verification Requirements

**Definition of "Complete" for Meet:**

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

**Phase 4 Complete (My Meet Dashboard):**
- ✅ Dashboard loads meetups by author
- ✅ Statistics calculate correctly (total, upcoming, past)
- ✅ Filters work (search, type, date range)
- ✅ Create navigates to create page
- ✅ Edit navigates with correct dTag
- ✅ Delete publishes Kind 5 event with NIP-09 compliance
- ✅ Ownership verified (pubkey match)

**Phase 5 Complete (Browse Meet):**
- ✅ Meet page loads public meetups from relays
- ✅ Search/filter functionality works
- ✅ Date/time display correct
- ✅ Location display correct
- ✅ Meetup detail page loads
- ✅ RSVP button works

**Phase 6 Complete (Create/Edit Meetup):**
- ✅ Create page loads form
- ✅ Form validation works
- ✅ Date/time picker works
- ✅ Location input works (text or geohash)
- ✅ Meetup publishes successfully
- ✅ Edit page loads meetup data
- ✅ Update uses NIP-33 replacement (same dTag)
- ✅ Auto-redirect after success

**Phase 7 Complete (RSVP System):**
- ✅ RSVP button displays correct state
- ✅ RSVP publishes Kind 31925 event
- ✅ Attendees list shows RSVPs
- ✅ RSVP counts update

**Phase 8 Complete (Navigation):**
- ✅ Meet link shows for all users
- ✅ My Meet link shows only when authenticated
- ✅ My Meet link hidden when not authenticated
- ✅ Navigation functional on desktop + mobile

**Phase 9 Complete (End-to-End):**
- ✅ User creates meetup → appears in my-meet
- ✅ User edits meetup → updates appear
- ✅ User deletes meetup → disappears from list + Kind 5 published
- ✅ User RSVPs to meetup → RSVP shows in attendees list
- ✅ Ownership verified (can't edit others' meetups)
- ✅ Public meetups appear in browse
- ✅ Tested on https://nostrcoin.vercel.app (not localhost)

**Phase 10 Complete (Documentation):**
- ✅ NIP matrix updated with Meet status
- ✅ README updated with Meet feature
- ✅ All changes committed with proper message format

### Anti-Pattern Prevention

**RED FLAGS - STOP IMMEDIATELY IF:**
- 🚩 Writing event creation logic in hook (use GenericEventService)
- 🚩 Querying relays directly from component (use service layer)
- 🚩 Creating new tag patterns without justification
- 🚩 Using Kind 30023 instead of Kind 31923 (wrong event kind!)
- 🚩 Building without testing each phase
- 🚩 Marking complete without user verification

**MANDATORY QUESTIONS BEFORE EACH PHASE:**
1. **Does this violate SOA?** → If yes, redesign
2. **Can I reuse existing code?** → Grep first, then code
3. **Is this following Shop pattern?** → Follow it, don't deviate
4. **Am I using correct event kind?** → Kind 31923, not 30023
5. **Have I tested this phase?** → Test before moving on
6. **Does user confirm it works?** → Get explicit confirmation

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

### 1.1 Create Meetup Types File
- **File**: `/src/types/meetup.ts` (NEW)
- **Action**: CREATE new file
- **Inspiration**: `/src/types/shop.ts` but adapted for calendar events

**Interfaces**:

```typescript
/**
 * Meetup form data interface
 * Maps to MeetupForm fields
 */
export interface MeetupData {
  // Basic Information
  name: string;
  description: string;
  
  // Date & Time
  startTime: number; // Unix timestamp (seconds)
  endTime?: number; // Unix timestamp (seconds, optional)
  timezone?: string; // IANA timezone (e.g., 'America/New_York')
  
  // Location
  location: string; // Physical address OR "Virtual"
  geohash?: string; // Geohash for map coordinates (optional)
  isVirtual: boolean;
  virtualLink?: string; // Video call link if virtual
  
  // Categorization
  meetupType: 'gathering' | 'workshop' | 'conference' | 'casual' | 'networking' | 'other';
  
  // Media
  imageUrl?: string; // Event image
  
  // Tags & Keywords
  tags: string[];
  
  // Host Information
  hostPubkey: string;
  coHosts?: string[]; // Array of pubkeys
}

/**
 * Meetup Nostr event (Kind 31923)
 */
export interface MeetupNostrEvent extends NostrEvent {
  kind: 31923;
  tags: [
    ['d', string], // Unique identifier (dTag)
    ['t', 'nostr-for-nomads-meetup'], // System tag
    ['name', string], // Event name
    ['start', string], // Unix timestamp
    ['end'?, string], // Unix timestamp (optional)
    ['location', string], // Location string
    ['g'?, string], // Geohash (optional)
    ['image'?, string], // Event image (optional)
    ['p', string, string?, string?], // Host/participants (multiple allowed)
    ...Array<['t', string]> // User tags
  ];
  content: string; // Description (markdown)
}

/**
 * Meetup event from relay (parsed)
 */
export interface MeetupEvent {
  id: string;
  dTag: string;
  pubkey: string;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  timezone?: string;
  location: string;
  geohash?: string;
  isVirtual: boolean;
  virtualLink?: string;
  imageUrl?: string;
  meetupType: string;
  tags: string[];
  hostPubkey: string;
  coHosts?: string[];
  createdAt: number;
  publishedAt: number;
  rsvpCount?: {
    accepted: number;
    declined: number;
    tentative: number;
  };
}

/**
 * Meetup card data for display
 */
export interface MeetupCardData {
  id: string;
  dTag: string;
  name: string;
  description: string;
  startTime: number;
  endTime?: number;
  location: string;
  isVirtual: boolean;
  imageUrl?: string;
  meetupType: string;
  tags: string[];
  pubkey: string; // Host for ownership check
  createdAt: number;
  rsvpCount?: {
    accepted: number;
    declined: number;
    tentative: number;
  };
}

/**
 * RSVP data
 */
export interface RSVPData {
  eventDTag: string; // Reference to meetup dTag
  eventPubkey: string; // Meetup creator pubkey
  status: 'accepted' | 'declined' | 'tentative';
  comment?: string; // Optional RSVP message
}

/**
 * RSVP Nostr event (Kind 31925)
 * NIP-33 parameterized replaceable event
 */
export interface RSVPNostrEvent extends NostrEvent {
  kind: 31925;
  tags: [
    ['d', string], // Deterministic dTag: 'rsvp:${eventDTag}'
    ['a', string], // Canonical reference: '31923:${eventPubkey}:${eventDTag}'
    ['e', string]?, // Optional: specific event snapshot ID
    ['status', 'accepted' | 'declined' | 'tentative'],
    ['p', string], // Event creator pubkey
  ];
  content: string; // Optional comment
}

/**
 * Meetup publishing result
 */
export interface MeetupPublishingResult {
  success: boolean;
  eventId?: string;
  dTag?: string;
  error?: string;
  publishedRelays?: string[];
  failedRelays?: string[];
  [key: string]: unknown;
}

/**
 * Meetup publishing state
 */
export interface MeetupPublishingState {
  isPublishing: boolean;
  uploadProgress: number | MeetupPublishingProgress;
  currentStep: 'idle' | 'validating' | 'uploading' | 'creating' | 'publishing' | 'complete' | 'error';
  error: string | null;
  result: MeetupPublishingResult | null;
}

/**
 * Meetup publishing progress
 */
export interface MeetupPublishingProgress {
  step: 'validating' | 'uploading' | 'publishing' | 'complete';
  progress: number; // 0-100
  message: string;
  details?: string;
}

/**
 * Meetup validation result
 */
export interface MeetupValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    virtualLink?: string;
    meetupType?: string;
    tags?: string;
  };
}

/**
 * Parsed RSVP with user info
 */
export interface ParsedRSVP {
  pubkey: string;
  status: 'accepted' | 'declined' | 'tentative';
  comment?: string;
  timestamp: number;
  displayName?: string;
  npub?: string;
}
```

---

## Phase 2: Configuration

### 2.1 Create Meetup Config File
- **File**: `/src/config/meetup.ts` (NEW)
- **Action**: CREATE new file

```typescript
export const MEETUP_TYPES = [
  { id: 'gathering', name: 'Social Gathering', icon: '👥' },
  { id: 'workshop', name: 'Workshop', icon: '🛠️' },
  { id: 'conference', name: 'Conference', icon: '🎤' },
  { id: 'casual', name: 'Casual Meetup', icon: '☕' },
  { id: 'networking', name: 'Networking', icon: '🤝' },
  { id: 'other', name: 'Other', icon: '📅' },
];

export const RSVP_STATUSES = [
  { id: 'accepted', name: 'Going', icon: '✅', color: 'green' },
  { id: 'declined', name: 'Not Going', icon: '❌', color: 'red' },
  { id: 'tentative', name: 'Maybe', icon: '❓', color: 'yellow' },
];

export function getMeetupTypes() {
  return MEETUP_TYPES;
}

export function getRSVPStatuses() {
  return RSVP_STATUSES;
}

export function getMeetupTypeById(id: string) {
  return MEETUP_TYPES.find(type => type.id === id);
}

export function getRSVPStatusById(id: string) {
  return RSVP_STATUSES.find(status => status.id === id);
}
```

---

## Phase 3: Service Layer - GenericEventService Enhancement

### 3.1 Add Calendar Event Creation to GenericEventService
- **File**: `/src/services/generic/GenericEventService.ts`
- **Action**: ADD new method

**Method to Implement:**

```typescript
/**
 * Create a NIP-52 calendar event (Kind 31923)
 * 
 * @param eventData - Calendar event data
 * @param signer - Nostr signer
 * @param dTag - Optional dTag for updates
 */
public async createCalendarEvent(
  eventData: {
    name: string;
    description: string;
    startTime: number;
    endTime?: number;
    location: string;
    geohash?: string;
    imageUrl?: string;
    tags: string[];
    hostPubkey: string;
    coHosts?: string[];
  },
  signer: NostrSigner,
  dTag?: string
): Promise<{
  success: boolean;
  event?: NostrEvent;
  error?: string;
}> {
  try {
    const pubkey = await this.getSignerPubkey(signer);
    
    // Generate dTag if not provided
    const eventDTag = dTag || `meetup-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    // Build tags array
    const tags: string[][] = [
      ['d', eventDTag],
      ['t', 'nostr-for-nomads-meetup'],
      ['name', eventData.name],
      ['start', eventData.startTime.toString()],
      ['location', eventData.location],
      ['p', eventData.hostPubkey, '', 'host'],
    ];
    
    // Add optional tags
    if (eventData.endTime) {
      tags.push(['end', eventData.endTime.toString()]);
    }
    
    if (eventData.geohash) {
      tags.push(['g', eventData.geohash]);
    }
    
    if (eventData.imageUrl) {
      tags.push(['image', eventData.imageUrl]);
    }
    
    // Add co-hosts
    if (eventData.coHosts && eventData.coHosts.length > 0) {
      eventData.coHosts.forEach(coHostPubkey => {
        tags.push(['p', coHostPubkey, '', 'co-host']);
      });
    }
    
    // Add user tags
    if (eventData.tags && eventData.tags.length > 0) {
      eventData.tags.forEach(tag => {
        tags.push(['t', tag]);
      });
    }
    
    // Create unsigned event
    const unsignedEvent: UnsignedEvent = {
      kind: 31923,
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: eventData.description,
    };
    
    // Sign event
    const signedEvent = await this.signEvent(unsignedEvent, signer);
    
    return {
      success: true,
      event: signedEvent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create calendar event',
    };
  }
}
```

### 3.2 Add RSVP Event Creation to GenericEventService
- **File**: `/src/services/generic/GenericEventService.ts`
- **Action**: ADD new method

**Method to Implement:**

```typescript
/**
 * Create a NIP-52 RSVP event (Kind 31925)
 * NIP-33 parameterized replaceable event with deterministic dTag
 * 
 * @param rsvpData - RSVP data
 * @param signer - Nostr signer
 * @param eventId - Optional: specific event snapshot ID to reference
 */
public async createRSVPEvent(
  rsvpData: {
    eventDTag: string;
    eventPubkey: string;
    status: 'accepted' | 'declined' | 'tentative';
    comment?: string;
  },
  signer: NostrSigner,
  eventId?: string
): Promise<{
  success: boolean;
  event?: NostrEvent;
  error?: string;
}> {
  try {
    const pubkey = await this.getSignerPubkey(signer);
    
    // Create deterministic dTag for replaceability (one RSVP per user per meetup)
    const rsvpDTag = `rsvp:${rsvpData.eventDTag}`;
    
    // Build canonical 'a' tag reference (EXACT format required)
    const canonicalATag = `31923:${rsvpData.eventPubkey}:${rsvpData.eventDTag}`;
    
    // Build tags array
    const tags: string[][] = [
      ['d', rsvpDTag],
      ['a', canonicalATag],
      ['status', rsvpData.status],
      ['p', rsvpData.eventPubkey],
    ];
    
    // Add optional event snapshot reference
    if (eventId) {
      tags.push(['e', eventId]);
    }
    
    // Create unsigned event
    const unsignedEvent: UnsignedEvent = {
      kind: 31925,
      pubkey,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: rsvpData.comment || '',
    };
    
    // Sign event
    const signedEvent = await this.signEvent(unsignedEvent, signer);
    
    return {
      success: true,
      event: signedEvent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create RSVP event',
    };
  }
}
```

---

## Phase 4: Service Layer - MeetService (Business Layer)

### 4.1 Create MeetService
- **File**: `/src/services/business/MeetService.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/services/business/ShopService.ts`
- **Adapt**: Replace product → meetup, use Kind 31923 instead of Kind 30023

**Methods to Implement:**

```typescript
/**
 * Create a new meetup with image upload, event creation and publishing
 * 
 * @param meetupData - Meetup data
 * @param imageFile - Optional event image
 * @param signer - Nostr signer
 * @param existingDTag - Optional dTag for updates
 * @param onProgress - Optional callback for progress updates
 */
export async function createMeetup(
  meetupData: MeetupData,
  imageFile: File | null,
  signer: NostrSigner,
  existingDTag?: string,
  onProgress?: (progress: MeetupPublishingProgress) => void
): Promise<MeetupPublishingResult>

/**
 * Fetch meetups by author pubkey
 * 
 * @param pubkey - Author's public key
 */
export async function fetchMeetupsByAuthor(
  pubkey: string
): Promise<MeetupEvent[]>

/**
 * Fetch a single meetup by dTag
 * 
 * @param dTag - The meetup's dTag identifier
 */
export async function fetchMeetupById(
  dTag: string
): Promise<MeetupEvent | null>

/**
 * Delete a meetup by publishing NIP-09 deletion event
 * 
 * @param eventId - The event ID to delete
 * @param signer - Nostr signer
 * @param pubkey - Author's public key
 * @param title - Meetup title (for deletion reason)
 */
export async function deleteMeetup(
  eventId: string,
  signer: NostrSigner,
  pubkey: string,
  title: string
): Promise<{ success: boolean; publishedRelays?: string[]; failedRelays?: string[]; error?: string }>

/**
 * Fetch public meetups for browse/listing view
 * 
 * @param limit - Maximum number of meetups to fetch
 * @param until - Optional timestamp for pagination
 * @param startAfter - Optional filter for upcoming events only
 */
export async function fetchPublicMeetups(
  limit: number = 20,
  until?: number,
  startAfter?: number
): Promise<MeetupCardData[]>

/**
 * Create an RSVP to a meetup
 * NIP-33 parameterized replaceable - updates existing RSVP if user already RSVP'd
 * 
 * @param rsvpData - RSVP data
 * @param signer - Nostr signer
 * @param meetupEventId - Optional: specific meetup event snapshot ID
 */
export async function createRSVP(
  rsvpData: RSVPData,
  signer: NostrSigner,
  meetupEventId?: string
): Promise<{ success: boolean; error?: string }>

/**
 * Delete an RSVP (cancel attendance)
 * Publishes Kind 5 deletion event referencing all RSVP event IDs across relays
 * 
 * @param eventDTag - Meetup dTag
 * @param signer - Nostr signer
 * @param meetupName - Meetup name (for deletion reason)
 */
export async function deleteRSVP(
  eventDTag: string,
  signer: NostrSigner,
  meetupName: string
): Promise<{ success: boolean; error?: string }>

/**
 * Fetch RSVPs for a specific meetup with deduplication
 * Groups by dTag, sorts by created_at DESC, takes latest per user
 * 
 * @param eventDTag - Meetup dTag
 * @param eventPubkey - Meetup creator pubkey
 */
export async function fetchRSVPs(
  eventDTag: string,
  eventPubkey: string
): Promise<ParsedRSVP[]>

/**
 * Fetch all RSVPs created by a user (their RSVP history)
 * 
 * @param userPubkey - User's public key
 */
export async function fetchMyRSVPs(
  userPubkey: string
): Promise<Array<{
  rsvp: ParsedRSVP;
  meetup: MeetupCardData | null;
}>>
```

**Key Implementation Details:**
- Use `GenericEventService.createCalendarEvent()` for Kind 31923 events
- Use `GenericEventService.createRSVPEvent()` for Kind 31925 RSVPs
- Use `GenericEventService.createDeletionEvent()` for NIP-09
- Use `GenericRelayService.queryEvents()` for queries
- Query filter: `{ kinds: [31923], '#t': ['nostr-for-nomads-meetup'] }`
- RSVP query: `{ kinds: [31925], '#a': ['31923:${eventPubkey}:${eventDTag}'] }` (use canonical format)
- Deduplicate by dTag (NIP-33 parameterized replaceable)

**RSVP Deduplication Logic:**
```typescript
// Fetch RSVPs with deduplication
const fetchRSVPs = async (eventDTag: string, eventPubkey: string) => {
  const canonicalATag = `31923:${eventPubkey}:${eventDTag}`;
  
  // Query all RSVPs referencing this meetup
  const events = await GenericRelayService.queryEvents({
    kinds: [31925],
    '#a': [canonicalATag],
  });
  
  // Group by dTag (one RSVP per user)
  const rsvpMap = new Map<string, NostrEvent>();
  
  for (const event of events) {
    const dTag = event.tags.find(t => t[0] === 'd')?.[1];
    if (!dTag) continue;
    
    // If we already have this dTag, keep the newer one
    const existing = rsvpMap.get(dTag);
    if (!existing || event.created_at > existing.created_at) {
      rsvpMap.set(dTag, event);
    }
  }
  
  // Convert to ParsedRSVP array
  return Array.from(rsvpMap.values()).map(event => parseRSVP(event));
};
```

**RSVP Deletion Logic:**
```typescript
// Delete RSVP across all relays
const deleteRSVP = async (eventDTag: string, signer: NostrSigner, meetupName: string) => {
  const pubkey = await signer.getPublicKey();
  const rsvpDTag = `rsvp:${eventDTag}`;
  
  // Query all relays for this user's RSVP
  const events = await GenericRelayService.queryEvents({
    kinds: [31925],
    authors: [pubkey],
    '#d': [rsvpDTag],
  });
  
  // Collect all event IDs (may differ across relays)
  const eventIds = events.map(e => e.id);
  
  if (eventIds.length === 0) {
    return { success: false, error: 'No RSVP found to delete' };
  }
  
  // Create deletion event with ALL event IDs
  const deletionEvent = await GenericEventService.createDeletionEvent(
    eventIds,
    pubkey,
    `RSVP cancelled for ${meetupName}`,
    [['k', '31925']]
  );
  
  // Publish deletion
  await GenericEventService.publishEvent(deletionEvent, signer);
  
  return { success: true };
};
```

---

## Phase 5: Service Layer - MeetValidationService

### 5.1 Create MeetValidationService
- **File**: `/src/services/business/MeetValidationService.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/services/business/ProductValidationService.ts`
- **Adapt**: Meetup-specific validation rules

**Validation Rules:**
- `name`: Required, 5-100 characters
- `description`: Required, 20-2000 characters
- `startTime`: Required, must be in future (for creation)
- `endTime`: Optional, must be after startTime if provided
- `location`: Required, 3-200 characters
- `virtualLink`: Required if isVirtual is true
- `meetupType`: Required, valid type
- `tags`: Optional, max 10 tags

---

## Phase 6: Hooks

### 6.1 Create useMeetPublishing Hook
- **File**: `/src/hooks/useMeetPublishing.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/hooks/useShopPublishing.ts`
- **Adapt**: Replace product → meetup

**Hook Interface:**
```typescript
export function useMeetPublishing() {
  return {
    isPublishing: boolean;
    uploadProgress: number | MeetupPublishingProgress;
    currentStep: string;
    error: string | null;
    result: MeetupPublishingResult | null;
    publishMeetup: (meetupData, imageFile, signer, existingDTag?) => Promise<void>;
    reset: () => void;
  };
}
```

### 6.2 Create usePublicMeetups Hook
- **File**: `/src/hooks/usePublicMeetups.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/hooks/usePublicProducts.ts`
- **Adapt**: Replace product → meetup

**Hook Interface:**
```typescript
export function usePublicMeetups(limit = 20, upcomingOnly = false) {
  return {
    meetups: MeetupCardData[];
    isLoading: boolean;
    error: string | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
  };
}
```

### 6.3 Create useMeetupEditing Hook
- **File**: `/src/hooks/useMeetupEditing.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/hooks/useProductEditing.ts`
- **Adapt**: Replace product → meetup

### 6.4 Create useMyMeetups Hook
- **File**: `/src/hooks/useMyMeetups.ts` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/hooks/useMyShopProducts.ts`
- **Adapt**: Replace product → meetup

### 6.5 Create useRSVP Hook
- **File**: `/src/hooks/useRSVP.ts` (NEW)
- **Action**: CREATE new file
- **Purpose**: Manage RSVP state and actions

**Hook Interface:**
```typescript
export function useRSVP(meetupDTag: string, meetupPubkey: string) {
  return {
    myRSVP: ParsedRSVP | null;
    allRSVPs: ParsedRSVP[];
    isLoading: boolean;
    error: string | null;
    rsvp: (status: 'accepted' | 'declined' | 'tentative', comment?: string) => Promise<void>;
  };
}
```

### 6.6 Create useMyRSVPs Hook
- **File**: `/src/hooks/useMyRSVPs.ts` (NEW)
- **Action**: CREATE new file
- **Purpose**: Fetch and manage user's RSVP history across all meetups

**Hook Interface:**
```typescript
export function useMyRSVPs(userPubkey?: string) {
  return {
    rsvps: Array<{
      rsvp: ParsedRSVP;
      meetup: MeetupCardData | null;
    }>;
    isLoading: boolean;
    error: string | null;
    reload: () => Promise<void>;
    cancelRSVP: (eventDTag: string, meetupName: string) => Promise<void>;
    // Filtered views
    acceptedRSVPs: Array<{...}>;
    tentativeRSVPs: Array<{...}>;
    declinedRSVPs: Array<{...}>;
    upcomingMeetups: Array<{...}>; // Only accepted + future events
  };
}
```

**Implementation Details:**
1. Query relays for Kind 31925 events authored by user
2. **Deduplicate by dTag**: Group by `['d', ...]` tag, sort by `created_at` DESC, take latest
3. Parse each RSVP to extract meetup reference (from `#a` tag using canonical format)
4. Fetch corresponding meetup details (Kind 31923) for each RSVP
5. Combine RSVP data with meetup data
6. Filter into accepted/tentative/declined groups
7. Sort by meetup start time
8. Identify upcoming events (accepted RSVPs where startTime > now)
9. Provide `cancelRSVP()` method that publishes Kind 5 deletion across all relays

---

## Phase 7: Components

### 7.1 Create MyMeetupCard Component
- **File**: `/src/components/generic/MyMeetupCard.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/components/generic/MyProductCard.tsx`
- **Adapt**: Meetup-specific display fields

**Props:**
```typescript
{
  meetup: MeetupCardData;
  onEdit: (meetup: MeetupCardData) => void;
  onDelete: (meetup: MeetupCardData) => void;
}
```

**Display Fields:**
- Name, description (truncated)
- Start date/time (human-readable)
- Location (with virtual badge if applicable)
- Meetup type badge
- RSVP count (accepted/total)
- Image thumbnail
- Actions: View, Edit, Delete

### 7.2 Create MeetupCard Component
- **File**: `/src/components/generic/MeetupCard.tsx` (NEW)
- **Action**: CREATE new file
- **Purpose**: Public browse meetup card

**Props:**
```typescript
{
  meetup: MeetupCardData;
  showRSVPButton?: boolean;
}
```

### 7.3 Create MeetupForm Component
- **File**: `/src/components/pages/MeetupForm.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/components/pages/ProductForm.tsx`
- **Adapt**: Meetup-specific form fields

**Form Fields:**
1. **Basic Information**:
   - `name` - Text input (required)
   - `meetupType` - Dropdown (required)

2. **Date & Time**:
   - `startTime` - Date/time picker (required)
   - `endTime` - Date/time picker (optional)
   - `timezone` - Timezone select (optional)

3. **Location**:
   - `isVirtual` - Checkbox
   - `location` - Text input (required, "Virtual" if isVirtual)
   - `virtualLink` - Text input (required if isVirtual)
   - `geohash` - Optional (could use map picker)

4. **Description**:
   - `description` - TipTap rich text editor (required)

5. **Media**:
   - `image` - Single image upload (optional)

6. **Tags**:
   - `tags` - Tag input (optional)

### 7.4 Create RSVPButton Component
- **File**: `/src/components/generic/RSVPButton.tsx` (NEW)
- **Action**: CREATE new file
- **Purpose**: RSVP action button with status dropdown

**Props:**
```typescript
{
  meetupDTag: string;
  meetupPubkey: string;
  currentStatus: 'accepted' | 'declined' | 'tentative' | null;
  onRSVP: (status: string) => Promise<void>;
}
```

### 7.5 Create AttendeesList Component
- **File**: `/src/components/generic/AttendeesList.tsx` (NEW)
- **Action**: CREATE new file
- **Purpose**: Display list of RSVPs

**Props:**
```typescript
{
  rsvps: ParsedRSVP[];
  maxDisplay?: number;
}
```

### 7.6 Reuse DeleteConfirmationModal
- **File**: `/src/components/generic/DeleteConfirmationModal.tsx`
- **Action**: REUSE existing component (no changes needed)

---

## Phase 8: Pages

### 8.1 Update Meet Browse Page
- **File**: `/src/app/meet/page.tsx`
- **Action**: MODIFY existing file
- **Changes**:
  - Remove mock data
  - Add `usePublicMeetups()` hook
  - Add auth check (public page, no auth required)
  - Keep existing filters (type, location, search)

### 8.2 Create My Meet Dashboard Page
- **File**: `/src/app/my-meet/page.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/app/my-shop/page.tsx`
- **Adapt**: Replace product → meetup

**Features:**
- Auth-gated
- Fetch user's meetups via `fetchMeetupsByAuthor()`
- Statistics dashboard (total meetups, upcoming, past, by type)
- Filter panel (search, type, date range)
- Grid/list view toggle
- Meetup cards with Edit/Delete actions
- Create Meetup button
- Loading/error/empty states

### 8.3 Create Meetup Detail Page
- **File**: `/src/app/meet/[id]/page.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/app/shop/[id]/page.tsx`
- **Adapt**: Meetup-specific display

**Features:**
- Fetch meetup by dTag
- Display all meetup info (date/time, location, description)
- Event image
- RSVP button
- Attendees list
- Host profile preview
- Add to calendar button
- Share button
- Loading/error/not found states

### 8.4 Create Meetup Create Page
- **File**: `/src/app/my-meet/create/page.tsx` (NEW)
- **Action**: CREATE new file
- **Features**:
  - Auth-gated
  - Render `MeetupForm` component
  - Handle form submission via `useMeetPublishing`
  - Auto-redirect to My Meet after success

### 8.5 Create Meetup Edit Page
- **File**: `/src/app/my-meet/edit/[id]/page.tsx` (NEW)
- **Action**: CREATE new file
- **Copy from**: `/src/app/my-shop/edit/[id]/page.tsx`
- **Adapt**: Meetup-specific

**Features:**
- Auth-gated
- Fetch meetup by dTag
- Ownership verification
- Pre-populate `MeetupForm`
- Handle update via `createMeetup(data, image, signer, existingDTag)`
- Auto-redirect to My Meet after success

### 8.6 Create My RSVPs Page
- **File**: `/src/app/my-meet/rsvps/page.tsx` (NEW)
- **Action**: CREATE new file
- **Purpose**: Show user's RSVP history across all meetups

**Features:**
- Auth-gated (require sign-in)
- Use `useMyRSVPs()` hook to fetch user's RSVPs
- Display sections:
  - **Upcoming Events** (accepted RSVPs where startTime > now)
  - **All RSVPs** with tabs:
    - Going (accepted)
    - Maybe (tentative)
    - Declined
- Each item shows:
  - Meetup card with name, date/time, location
  - RSVP status badge
  - Link to meetup detail page
  - "Change RSVP" button
- Statistics:
  - Total RSVPs
  - Upcoming events count
  - RSVPs by status breakdown
- Filter/search functionality
- Loading/error/empty states

**Layout:**
```tsx
export default function MyRSVPsPage() {
  const { user } = useAuthStore();
  const {
    rsvps,
    isLoading,
    error,
    acceptedRSVPs,
    tentativeRSVPs,
    declinedRSVPs,
    upcomingMeetups,
  } = useMyRSVPs(user?.pubkey);
  
  return (
    <div>
      {/* Statistics Dashboard */}
      {/* Upcoming Events Section (accepted + future) */}
      {/* Tabbed View: Going / Maybe / Declined */}
      {/* Meetup cards with RSVP status */}
    </div>
  );
}
```

---

## Phase 9: Navigation

### 9.1 Add My Meet Link to Header
- **File**: `/src/components/Header.tsx`
- **Action**: MODIFY existing file
- **Changes**:
  - Add "My Meet" link in authenticated user menu
  - Desktop: Add to top nav after "Meet"
  - Mobile: Add to mobile menu (authenticated section)

### 9.2 Add My RSVPs Link to Navigation
- **File**: `/src/components/Header.tsx` OR My Meet dashboard
- **Action**: ADD navigation link
- **Options**:
  1. **Header dropdown** (recommended): Add "My RSVPs" under "My Meet" in user dropdown
  2. **My Meet dashboard tabs**: Add tab navigation within `/my-meet` pages
     - "My Meetups" (default)
     - "My RSVPs" (new tab)

**Recommended Approach: Tabs within My Meet**
- `/my-meet` → My Meetups (meetups user created)
- `/my-meet/rsvps` → My RSVPs (meetups user RSVP'd to)
- Add tab navigation at top of both pages for easy switching

---

## Phase 10: Testing & Verification

### 10.1 Build Test
- **Command**: `npm run build`
- **Verify**: No TypeScript errors
- **Fix**: Any type mismatches or import errors

### 10.2 Manual Testing Checklist
- [ ] Navigate to `/meet` (public)
- [ ] See public meetups from relays
- [ ] Search meetups by keyword
- [ ] Filter by type, location
- [ ] Toggle upcoming/all events
- [ ] Click meetup → opens detail page
- [ ] Navigate to `/my-meet` (authenticated)
- [ ] See own meetups dashboard
- [ ] Statistics display correctly
- [ ] Filter own meetups
- [ ] Click "Create Meetup" → navigates to create page
- [ ] Create meetup form validation works
- [ ] Upload event image
- [ ] Publish meetup successfully
- [ ] Meetup appears in My Meet
- [ ] Meetup appears in public Meet
- [ ] Click "Edit" → loads meetup data
- [ ] Update meetup successfully
- [ ] Updated data appears
- [ ] Click "Delete" → opens confirmation modal
- [ ] Confirm delete → publishes NIP-09 event
- [ ] Deleted meetup removed from list
- [ ] RSVP button works
- [ ] RSVP publishes Kind 31925 event with deterministic dTag
- [ ] Verify RSVP event has `['d', 'rsvp:${eventDTag}']` tag
- [ ] Verify RSVP event has canonical `['a', '31923:pubkey:dTag']` tag
- [ ] Change RSVP status → new event replaces old one (same dTag)
- [ ] Attendees list updates with deduplicated RSVPs
- [ ] Cancel RSVP publishes Kind 5 deletion
- [ ] Verify deletion event references all RSVP event IDs across relays
- [ ] Navigate to `/my-meet/rsvps` (authenticated)
- [ ] See all RSVPs user has made (deduplicated by dTag)
- [ ] Upcoming events section shows only accepted + future
- [ ] Tabs show Going/Maybe/Declined correctly
- [ ] RSVP statistics display correctly
- [ ] Click meetup → navigates to detail page
- [ ] Change RSVP status works (replaces existing RSVP)
- [ ] Updated RSVP appears in correct tab
- [ ] Cancel RSVP works (deletion event published)
- [ ] Cancelled RSVP disappears from list
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] Error states display with retry option

### 10.3 Nostr Event Verification
- [ ] Query relays for meetups by author pubkey
- [ ] Verify Kind 31923 events returned
- [ ] Verify `#t` tag includes `nostr-for-nomads-meetup`
- [ ] Verify required tags (name, start, location)
- [ ] Update creates new event with same dTag (NIP-33)
- [ ] Delete publishes Kind 5 event with correct reference
- [ ] RSVP publishes Kind 31925 event
- [ ] **RSVP has deterministic dTag**: `['d', 'rsvp:${eventDTag}']`
- [ ] **RSVP has canonical 'a' tag**: `['a', '31923:${eventPubkey}:${eventDTag}']` (exact format)
- [ ] **RSVP replaceability works**: New RSVP with same dTag replaces old one
- [ ] **RSVP deduplication works**: Query returns one RSVP per user (latest by created_at)
- [ ] **RSVP deletion works**: Kind 5 event references ALL event IDs across relays
- [ ] **RSVP deletion has 'k' tag**: `['k', '31925']` to specify deleted kind
- [ ] Deleted RSVPs no longer appear in queries
- [ ] Deleted meetups no longer appear in queries

---

## Phase 11: Documentation

### 11.1 Update NIP Implementation Matrix
- **File**: `/docs/nc-nip-kind-implementation-matrix.md`
- **Action**: UPDATE
- **Changes**:
  - Change Meet status: "Mock Data" → "Production"
  - Add NIP-52 (Calendar Events)
  - Update Kind 31923, 31925 usage
  - Add notes about meetup features

### 11.2 Update README
- **File**: `/README.md`
- **Action**: UPDATE
- **Changes**:
  - Move Meet from "UI-Only Features" → "Production Features"
  - Add description: "Decentralized calendar events and meetups on Nostr"
  - Add technical details (Kind 31923, RSVP system, etc.)

---

## Implementation Order (Recommended)

1. **Types** (Phase 1) - Foundation
2. **Configuration** (Phase 2) - Meetup types, RSVP statuses
3. **GenericEventService Enhancement** (Phase 3) - Calendar event + RSVP creation
4. **Business Service Layer** (Phase 4-5) - MeetService + validation
5. **Build & Test Services** - Verify services compile
6. **Hooks** (Phase 6) - State orchestration
7. **Build & Test Hooks** - Verify hooks compile
8. **Components** (Phase 7) - UI building blocks
9. **My Meet Pages** (Phase 8.2, 8.4, 8.5) - User's meetup management
10. **Meet Browse** (Phase 8.1, 8.3) - Public marketplace
11. **Navigation** (Phase 9) - Header links
12. **Build & Test Full App** - Final compilation check
13. **Manual Testing** (Phase 10.2-10.3) - End-to-end verification
14. **Documentation** (Phase 11) - Update docs

---

## Files Summary

### New Files (30 total)
1. `/src/types/meetup.ts` - Type definitions
2. `/src/config/meetup.ts` - Meetup types, RSVP statuses
3. `/src/services/business/MeetService.ts` - Business logic orchestration
4. `/src/services/business/MeetValidationService.ts` - Validation rules
5. `/src/hooks/useMeetPublishing.ts` - Meetup publishing orchestration
6. `/src/hooks/usePublicMeetups.ts` - Public browse hook
7. `/src/hooks/useMeetupEditing.ts` - Edit meetup orchestration
8. `/src/hooks/useMyMeetups.ts` - My Meet data fetching
9. `/src/hooks/useRSVP.ts` - RSVP management
10. `/src/hooks/useMyRSVPs.ts` - User's RSVP history
11. `/src/components/generic/MyMeetupCard.tsx` - Meetup card for dashboard
12. `/src/components/generic/MeetupCard.tsx` - Public browse card
13. `/src/components/pages/MeetupForm.tsx` - Create/edit form
14. `/src/components/generic/RSVPButton.tsx` - RSVP action button
15. `/src/components/generic/AttendeesList.tsx` - Attendees list
16. `/src/app/my-meet/page.tsx` - My Meet dashboard page
17. `/src/app/my-meet/create/page.tsx` - Create meetup page
18. `/src/app/my-meet/edit/[id]/page.tsx` - Edit meetup page
19. `/src/app/my-meet/rsvps/page.tsx` - My RSVPs page
20. `/src/app/meet/[id]/page.tsx` - Meetup detail page

### Modified Files (4)
1. `/src/services/generic/GenericEventService.ts` - Add calendar + RSVP methods
2. `/src/app/meet/page.tsx` - Replace mock data with Nostr integration
3. `/src/components/Header.tsx` - Add My Meet navigation link
4. `/docs/nc-nip-kind-implementation-matrix.md` - Update Meet status
5. `/README.md` - Document Meet feature

### Existing Files (Reused)
1. `/src/services/generic/GenericEventService.ts` - Signing, deletion
2. `/src/services/generic/GenericRelayService.ts` - Query, publish
3. `/src/components/generic/DeleteConfirmationModal.tsx` - Reuse as-is

---

## Key Differences from Shop/Contributions

### Event Kind
- **Shop/Contributions**: Kind 30023 (NIP-23 long-form content)
- **Meet**: Kind 31923 (NIP-52 calendar event)

### Required Tags
- **Shop/Contributions**: `['title', ...]`, `['published_at', ...]`
- **Meet**: `['name', ...]`, `['start', ...]`, `['location', ...]`

### Additional Features
- **Meet-Specific**: RSVP system (Kind 31925)
- **Meet-Specific**: Time-based indexing
- **Meet-Specific**: Geohash support for maps
- **Meet-Specific**: Co-host support

### Query Filters
- **Shop/Contributions**: `{ kinds: [30023], '#t': ['nostr-for-nomads-shop'] }`
- **Meet**: `{ kinds: [31923], '#t': ['nostr-for-nomads-meetup'] }`
- **Meet RSVPs**: `{ kinds: [31925], '#a': ['31923:pubkey:dTag'] }`

---

## Success Criteria

✅ User can browse public meetups in Meet
✅ User can search/filter meetups by type, location, date
✅ User can view meetup details
✅ User can RSVP to meetups (accepted/declined/tentative)
✅ User can view their RSVP history (/my-meet/rsvps)
✅ User can see upcoming events they're attending
✅ User can filter RSVPs by status (going/maybe/declined)
✅ User can create meetups (My Meet)
✅ User can edit their meetups
✅ User can delete their meetups (NIP-09)
✅ User can see statistics about their meetups
✅ Ownership is verified before edit/delete
✅ All operations publish to Nostr relays
✅ RSVP system works (Kind 31925 events)
✅ Build succeeds with no errors
✅ SOA architecture maintained
✅ Documentation updated

---

**Estimated Implementation Time**: 28-32 hours
**Complexity**: High (new event kinds, RSVP system, calendar-specific features)
**Risk**: Medium (NIP-52 less common than NIP-23, RSVP coordination)

---

**Status:** ⏳ Ready for Implementation  
**Next Action:** Begin Phase 1.1 - Create `/src/types/meetup.ts`
