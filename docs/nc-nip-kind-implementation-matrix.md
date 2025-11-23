# NIP/Kind Implementation Matrix

Reference document for Nostr protocol implementation across Nostr for Nomads (ncoin) pages and features.

## Matrix

| Feature | NIP-01 | NIP-05 | NIP-07 | NIP-09 | NIP-17 | NIP-19 | NIP-23 | NIP-33 | NIP-44 | NIP-78 | NIP-94 | NIP-96 | Kind 0 | Kind 1 | Kind 5 | Kind 14 | Kind 1059 | Kind 10063 | Kind 24242 | Kind 30023 | Kind 30078 | Status |
|---------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|---------|-----------|------------|------------|------------|------------|--------|
| Sign Up | ✅ Basic events | ❌ | ✅ Signer auth | ❌ | ❌ | ✅ npub/nsec | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Avatar upload | ✅ Profile create | ✅ Welcome note | ❌ | ❌ | ❌ | ❌ | ✅ Upload auth | ❌ | ❌ | Production |
| Sign In | ✅ Basic events | ❌ | ✅ Signer auth | ❌ | ❌ | ✅ npub/nsec | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Profile fetch | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Production |
| Profile | ✅ Event structure | ✅ DNS verification | ✅ Read/write | ❌ | ❌ | ✅ npub display | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Image upload | ✅ Profile metadata | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Upload auth | ❌ | ❌ | Production |
| Messages | ✅ Event queries | ❌ | ✅ Signing DMs | ❌ | ✅ Gift wraps | ✅ npub display | ❌ | ❌ | ✅ Encryption | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Rumor events | ✅ Encrypted DMs | ❌ | ❌ | ❌ | ❌ | Production |
| Payments | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | UI Only |
| My Shop | ✅ Event creation | ❌ | ✅ Signing | ✅ Deletion | ❌ | ✅ npub display | ✅ Long-form | ✅ Replaceable | ❌ | ❌ | ✅ imeta tags | ✅ Media upload | ❌ | ❌ | ✅ Delete events | ❌ | ❌ | ❌ | ✅ Upload auth | ✅ Products | ❌ | Production |
| Shop | ✅ Query events | ❌ | ❌ | ❌ | ❌ | ✅ npub display | ✅ Long-form | ✅ Replaceable | ❌ | ❌ | ✅ imeta tags | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Products | ❌ | Production |
| My Work | ✅ Event creation | ❌ | ✅ Signing | ✅ Deletion | ❌ | ✅ npub display | ✅ Long-form | ✅ Replaceable | ❌ | ❌ | ✅ imeta tags | ✅ Media upload | ❌ | ❌ | ✅ Delete events | ❌ | ❌ | ❌ | ✅ Upload auth | ✅ Work Opportunities | ❌ | Production |
| Work | ✅ Query events | ❌ | ❌ | ❌ | ❌ | ✅ npub display | ✅ Long-form | ✅ Replaceable | ❌ | ❌ | ✅ imeta tags | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Work Opportunities | ❌ | Production |
| Meet | ✅ Query events | ❌ | ❌ | ❌ | ❌ | ✅ npub display | ❌ | ❌ | ❌ | ❌ | ✅ imeta tags | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Production |
| My Meet | ✅ Full CRUD | ❌ | ✅ Signing | ✅ Deletion | ❌ | ✅ npub display | ❌ | ❌ | ❌ | ❌ | ✅ imeta tags | ✅ Media upload | ❌ | ❌ | ✅ Delete events | ❌ | ❌ | ❌ | ✅ Upload auth | ❌ | ❌ | Production |
| Explore | ✅ Query events | ❌ | ❌ | ❌ | ❌ | ✅ npub display | ✅ Long-form | ✅ Replaceable | ❌ | ❌ | ✅ imeta tags | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Contributions | ❌ | Production |
| My Contributions | ✅ Full CRUD | ❌ | ✅ Signing | ✅ Deletion | ❌ | ✅ npub display | ✅ Long-form | ✅ Replaceable | ❌ | ❌ | ✅ imeta tags | ✅ Media upload | ❌ | ❌ | ✅ Delete events | ❌ | ❌ | ❌ | ✅ Upload auth | ✅ Contributions | ❌ | Production |
| User Event Log | ✅ Query events | ❌ | ❌ | ❌ | ❌ | ✅ npub display | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Production |
| Cart (Planned) | ✅ Event creation | ❌ | ✅ Signing | ❌ | ❌ | ✅ npub display | ❌ | ✅ Replaceable | ❌ | ✅ App data | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ Cart storage | Planned |

## NIP Descriptions

### Core Protocol NIPs (Implemented)

- **NIP-01**: Basic protocol - event structure, signing, IDs, relay communication ✅
- **NIP-05**: DNS-based verification - `alice@example.com` identifiers ✅
- **NIP-07**: Browser extension signer - `window.nostr` interface (Alby, nos2x, Nostore) ✅
- **NIP-09**: Event deletion - Kind 5 deletion events ✅
- **NIP-17**: Private DMs - gift-wrapped encrypted messages (double encryption) ✅
- **NIP-19**: Bech32-encoded entities - npub, nsec, note, nprofile, nevent ✅
- **NIP-23**: Long-form content - articles, blog posts (Kind 30023) ✅
- **NIP-33**: Parameterized replaceable events - unique dTag, update-in-place ✅
- **NIP-44**: Encrypted payloads (v2) - ChaCha20 + HMAC-SHA256 for NIP-17 encryption ✅
- **NIP-52**: Calendar events - time-based events for meetups (Kind 31923 + 31925) ✅
- **NIP-78**: Application-specific data - Kind 30078 for cart/settings storage ✅
- **NIP-94**: File metadata - imeta tags for media attachments ✅

### External Protocols (Implemented)

- **Blossom (NIP-96 based)**: Decentralized CDN - media hosting with Nostr auth (Kind 24242), SHA-256 verification ✅

### NIPs Planned for Future Integration

- **NIP-11**: Relay capability discovery
- **NIP-46**: Remote signer protocol (mobile apps, Nostr Connect)
- **NIP-57**: Lightning Zaps (tip creators)
- **NIP-65**: Relay list metadata (user's preferred relay list)

## Kind Descriptions

### Implemented Event Kinds

- **Kind 0**: User metadata - profile info (name, display_name, about, picture, banner, website, nip05, lud16, lud06, birthday) ✅
- **Kind 1**: Short text note - public posts, welcome messages (used in sign-up verification) ✅
- **Kind 5**: Event deletion - NIP-09 deletion events (used in My Contributions, My Shop, My Work) ✅
- **Kind 14**: Rumor - unsigned event wrapped in NIP-17 gift-wrapped messages ✅
- **Kind 1059**: Gift wrap - encrypted outer layer for NIP-17 DMs (double-wrapped encryption with ephemeral keys) ✅
- **Kind 24242**: Blossom authorization - signed auth events for Blossom file uploads ✅
- **Kind 30023**: Long-form content - NIP-23/NIP-33 parameterized replaceable events (Shop, Work, Contributions) ✅
- **Kind 30078**: Application-specific data - NIP-78 for cart and settings storage ✅
- **Kind 31923**: Calendar event - NIP-52 time-based calendar events for meetups (replaceable) ✅
- **Kind 31925**: Calendar RSVP - NIP-52 RSVP events for meetup attendance (replaceable per user) ✅

### Event Kinds Implemented but Not Yet Used

- **Kind 10063**: User server list - Blossom CDN server discovery (implemented in GenericEventService.createUserServerListEvent())

## Feature Implementation Details

### Sign Up Workflow

- Generates Nostr keypair (nsec/npub) via `nostr-tools` (generateSecretKey + getPublicKey)
- **Choice 1**: Store nsec in encrypted localStorage for seamless app usage
- **Choice 2**: Use NIP-07 browser extension (Alby, nos2x, Nostore)
- Publishes Kind 0 profile metadata to configured relays
- Publishes Kind 1 welcome note for verification (silent, background operation)
- Blossom avatar upload with Kind 24242 authorization
- Creates encrypted backup file with profile and keys
- Background publishing (non-blocking) - user can proceed to Step 2 immediately
- Clears nsec from memory after backup creation (if using extension)
- Uses temporary signer during sign-up flow
- NIP-19 bech32 encoding for npub/nsec display

### Authentication (Sign In)

- **Method 1**: NIP-07 browser extensions (Alby, nos2x, Nostore)
- **Method 2**: Import nsec (for mobile users or those without extension)
- Fetches Kind 0 profile on login
- Stores pubkey in auth state
- Initializes message cache proactively (IndexedDB with encryption)
- Verifies signer pubkey matches authenticated user (prevents privacy breaches)

### Profile Management

- Publishes Kind 0 metadata events to Nostr relays
- Real-time NIP-05 DNS verification with status badges (verified/unverified/pending)
- NIP-07 browser extension or stored nsec for signing profile updates
- Blossom CDN for profile picture and banner images
- Image cropping with react-easy-crop (1:1 aspect ratio for avatars, 3:1 for banners)
- Field-level validation (display_name, about, website, birthday, lud16, lud06, nip05)
- Multi-relay publishing with success/failure tracking
- State propagation via auth store (Zustand) to all components

### Messaging System

- **NIP-17 gift-wrapped DMs** (double-wrapped encryption):
  - Kind 14 rumor events (unsigned, plaintext content)
  - Kind 1059 seal (encrypted rumor using NIP-44)
  - Kind 1059 gift wrap (seal encrypted with ephemeral key)
- **NIP-44 encryption** (ChaCha20-Poly1305 + HKDF-SHA256) for message payloads
- **Double-copy pattern**: Creates gift wrap for both sender and recipient
- IndexedDB cache with AES-GCM encryption for messages and conversations
- **MessageCacheService** - 30-day TTL, encrypted conversation/message storage
- **ProfileCacheService** - 7-day TTL, LRU eviction at 1000 entries
- **AdaptiveSync** - Dynamic polling intervals (1-10 minutes) based on message activity
  - Starts at 1 minute, increases 1.5x on empty syncs
  - Resets to 1 minute on new message detection
  - Stops on component unmount
- Duplicate message deduplication via processedMessageIds ref
- Self-message filtering (sender === recipient) to prevent invalid conversations
- Cache migration system for data cleanup

### Meetings (Video Calls)

- **Status**: Removed - feature deprecated
- URL creator interface for Jitsi/meet.jit.si rooms removed from navigation
- No Nostr integration, UI removed from application
- **Note**: Different from "Meet" (meetups/events) which is in production

### Payments

- **Status**: UI only - no Nostr integration
- Form interface for Lightning/Bitcoin payments
- No backend implementation
- Placeholder inputs for invoice/address

### Shop (Marketplace)

- **Status**: Production - marketplace for products/services
- **My Shop**: Full CRUD operations for user's own Kind 30023 products
  - Create/edit/delete products via Kind 30023 events
  - NIP-09 deletion events for removing products
  - Multi-attachment support via Blossom (images)
  - Tag pattern: `nostr-for-nomads-shop`
  - Statistics dashboard: Total products, by category, by condition
  - Filters: Search, category, condition
- **Public Shop**: Browse all products from network
  - Fetches Kind 30023 events with shop tag
  - Product cards with pricing, category, condition
  - Click to view product details
- **Service architecture**:
  - `ShopBusinessService` - Business logic orchestration
  - `ShopService` - Relay queries and parsing
  - `NostrEventService.createProductEvent()` - Event creation
  - `useShopPublishing` - Generic wrapper pattern
- **dTag prefix**: `product-{timestamp}-{random}` for stable IDs
- Full integration with relays, Blossom uploads, NIP-33 replaceable events

### Work (Job/Freelance Marketplace)

- **Status**: Production - job board for freelance and remote opportunities
- **My Work**: Full CRUD operations for user's own Kind 30023 work postings
  - Create/edit/delete work opportunities via Kind 30023 events
  - NIP-09 deletion events for removing work posts
  - Multi-attachment support via Blossom (images, videos, audio)
  - Tag pattern: `nostr-for-nomads-work`
  - Statistics dashboard: Total opportunities, by category, by job type
  - Filters: Search, category, job type, region
- **Public Work**: Browse all opportunities from network
  - Fetches Kind 30023 events with work tag
  - Work cards with job type, pay rate, duration, location
  - Click to view opportunity details with contact functionality
- **Service architecture**:
  - `WorkService` (WorkBusinessService) - Business logic orchestration
  - `GenericWorkService` - Relay queries and parsing
  - `WorkContentService` - Content detail provider
  - `WorkValidationService` - Field validation
  - `NostrEventService.createWorkEvent()` - Event creation
  - `useWorkPublishing` - Generic wrapper pattern
- **dTag prefix**: `work-{timestamp}-{random}` for stable IDs
- Full integration with relays, Blossom uploads, NIP-33 replaceable events
- Implements ContentDetailService pattern for work opportunity details

### Meet (Meetups & Events)

- **Status**: Production - location-based meetup organizer
- **My Meet**: Full CRUD operations for user's own Kind 31923 meetup events
  - Create/edit/delete meetups via Kind 31923 calendar events (NIP-52)
  - **Edit architecture**: Uses generic `useMeetupEditing` hook with `updateMeetup()` function
  - NIP-09 deletion events for removing meetups
  - **Single-image design** (intentional): One hero/banner image per event (see media config documentation)
    - Rationale: Matches calendar event best practices (Meetup.com, Eventbrite, Lu.ma)
    - Simplified UX for faster event creation
    - Consistent visual presentation in event listings
    - Better performance for calendar views
  - Tag pattern: `nostr-for-nomads-meetup`
  - Statistics dashboard: Total meetups, upcoming, past, total RSVPs (standardized with StatCard/StatBreakdown components)
  - Filters: Search, meetup type, status (upcoming/past)
  - RSVP management: Track RSVPs via Kind 31925 events
- **Public Meet**: Browse all meetups from network
  - Fetches Kind 31923 events (with and without system tag for backward compatibility)
  - Meetup cards with date, time, location (virtual/physical)
  - RSVP functionality with status tracking (accepted/declined/tentative)
  - Click to view meetup details with full RSVP list
- **Service architecture**:
  - `MeetService` - Business logic orchestration
  - `MeetUpdateService` - Update service for editing meetups
  - `useMeetupEditing` - Generic edit hook (56 lines, follows Contribution/Shop/Work pattern)
  - `GenericMeetService` - Relay queries and parsing
  - `GenericEventService.createCalendarEvent()` - NIP-52 event creation
  - `GenericEventService.createRSVPEvent()` - RSVP event creation
  - `usePublicMeetups` - Public meetup discovery hook
  - `useMyMeetups` - Personal meetup management hook
- **NIP-52 implementation**:
  - Calendar events with time-based queries
  - Required tags: `d`, `t` (system tag), `title`, `name`, `start`, `location`, `p` (host)
  - Optional tags: `end`, `timezone`, `g` (geohash), `image`, `virtual`, `meetup-type`
  - Participant tracking via p-tags with roles (host, co-host)
  - RSVP events with `a` tag referencing parent meetup
  - Deterministic dTag for replaceability: `rsvp:{eventDTag}`
- **dTag prefix**: `meetup-{timestamp}-{random}` for stable IDs
- Full integration with relays, Blossom uploads, NIP-52 calendar events (NOT NIP-33)

### Travel

- **Status**: Removed - feature deprecated
- Travel route removed from application
- No code, no UI, no services

### Explore & My Contributions

- **Status**: Production - nomad contributions platform
- **Explore page**: Browse all contributions from network
  - Fetches Kind 30023 events with contribution tag
  - Contribution cards with type, category, location, media
  - Click to view contribution details
- **My Contributions**: Full CRUD operations for user's own Kind 30023 contributions
  - Create at `/my-contributions/create` (auth-required)
  - Edit/delete contributions via Kind 30023 events
  - NIP-09 deletion events for removing contributions
  - Multi-attachment support via Blossom (images, videos, audio)
  - Tag pattern: `nostr-for-nomads-contribution`
  - Statistics dashboard: Total contributions, by type, by category
  - Filters: Search, contribution type, category
- **Service architecture**:
  - `ContributionService` - Business logic orchestration
  - `ContributionValidationService` - Field validation
  - `ContributionContentService` - Content provider interface
  - `GenericContributionService` - Relay queries and parsing
  - `NostrEventService.createContributionEvent()` - Event creation
- **Media support**: Blossom uploads with Kind 24242 authorization
- **dTag prefix**: `contribution-{timestamp}-{random}` for stable IDs
- Supports images, videos, and audio with NIP-94 imeta tags
- Field-level validation (title, description, category, type, location, etc.)
- Multi-attachment support with progress tracking
- Auto-redirect to detail page after successful publish (1 second delay)

### Architecture Pattern: Public Browse vs Personal Management

All content features follow consistent architecture:

| **Public Browse** | **Personal Management** | **Create Route** | **Event Kind** |
|-------------------|-------------------------|------------------|----------------|
| `/explore` | `/my-contributions` | `/my-contributions/create` | Kind 30023 |
| `/shop` | `/my-shop` | `/my-shop/create` | Kind 30078 |
| `/work` | `/my-work` | `/my-work/create` | Kind 30023 |
| `/meet` | `/my-meet` | `/my-meet/create` | Kind 31923 |

**Pattern consistency (Nov 2025 refactor)**:
- Public pages: Browse/discover for all users (authenticated or not)
- My-* pages: Full CRUD operations for authenticated user's own content
- Create routes: Auth-required, under `/my-{feature}/create` namespace
- Edit routes: `/my-{feature}/edit/[dTag]` with ownership verification
- All features use same SOA layers, tag patterns, service architecture

### User Event Log

- **Status**: Production - analytics dashboard
- Fetches event publishing analytics from `/api/get-user-events` and `/api/get-all-events`
- Data stored in Upstash Redis via EventLoggingService
- Tracks relay publishing success/failure metrics
- Real-time event monitoring with auto-refresh
- Displays Kind 0, Kind 1, Kind 14, Kind 1059, Kind 24242 event analytics
- Pagination, sorting, and filtering capabilities

## Technical Patterns

### Event Logging & Analytics

- **EventLoggingService** - Upstash Redis-based analytics tracking
  - Logs all event publishing attempts (Kind 0, 1, 14, 1059, 24242)
  - Tracks relay success/failure rates per event
  - Records processing duration, response times, retry attempts
  - Stores failed relay reasons for debugging
  - User-specific and global event queries via API routes
  - Powers User Event Log dashboard with pagination and filtering

### Event Creation

- All Kind 0 events created via `ProfileBusinessService.publishProfile()`
- Kind 1 welcome note created via `AuthBusinessService.publishWelcomeNote()`
- Kind 14/1059 events created via `NostrEventService.createRumor()`, `createSeal()`, `createGiftWrap()`
- Generic support for Kind 30023 via `GenericEventService.createNIP23Event()` (not yet used)
- Generic support for Kind 5 deletion via `GenericEventService.createDeletionEvent()` (not yet used)
- Event signing through NIP-07 browser extensions or stored nsec
- Automatic relay publishing via configured relay set

### Media Upload

- Blossom sequential upload with progress tracking
- Kind 24242 authorization for file uploads
- SHA-256 hashing and verification
- react-easy-crop for image cropping (1:1 and 3:1 aspect ratios)
- Supported formats: Images (JPEG, PNG, WebP, GIF)
- Max file size: 100MB per file

### Profile Resolution (3-tier fallback)

1. Kind 0 profile metadata (display_name field from event content)
2. NIP-05 verification identifier (e.g., `alice@example.com`)
3. Truncated npub display (UI fallback: `npub1abc...xyz`)

### Caching Strategy

- **ProfileCacheService** - IndexedDB persistent cache with 7-day TTL
  - LRU eviction at 1000 entries (prevents unbounded growth)
  - In-memory secondary cache (Map) for instant lookups
  - PBKDF2 key derivation from npub (100k iterations)
  - AES-256-GCM encryption-at-rest
- **MessageCacheService** - IndexedDB encrypted storage with 30-day TTL
  - Caches conversations (metadata, last message, unread count)
  - Caches messages (full conversation history)
  - Two-tier caching: In-memory Map + IndexedDB
  - Encryption using PBKDF2 + AES-GCM (100k iterations)
  - Migration system for schema updates and data cleanup
  - Automatic TTL-based cleanup on initialization
- **AdaptiveSync** - Background sync with exponential backoff
  - Dynamic polling interval: 1-10 minutes based on activity
  - Starts at 1 minute, increases 1.5x on empty syncs
  - Resets to 1 minute on new message detection
  - Stops on component unmount to prevent resource leaks
- Automatic cache clearing on sign-out for security
- Encryption-at-rest prevents casual DevTools browsing

## Security Notes

### NIP-07 Browser Extensions

- Never exposes private keys (nsec) to the application
- User confirms each signature request through extension UI
- Sandboxed execution context for secure key storage
- Supports all major extensions: Alby, nos2x, Nostore, Flamingo
- Graceful fallback prompts if no extension detected

### Alternative: Stored Nsec (Mobile/Extension-less Users)

- Nsec stored in encrypted localStorage via KVService
- AES-256-GCM encryption with PBKDF2 key derivation
- Allows seamless app usage without browser extension
- User can export backup file anytime
- Cleared on logout for multi-user device security

### NIP-17 Message Encryption

- Double gift-wrap pattern: Creates two copies (sender + recipient) for message retrieval
- NIP-44 v2 encryption (ChaCha20-Poly1305 + HKDF-SHA256)
- Ephemeral keys generated for each gift wrap (forward secrecy)
- One-time encryption keys prevent retroactive decryption
- Kind 14 rumor (plaintext) → Kind 1059 seal (encrypted) → Kind 1059 gift wrap (double-encrypted)
- Conversation-level encryption using NIP-44 sealed sender
- Self-healing: Both parties can retrieve full conversation history

### NIP-44 Encryption

- Modern encryption standard for Nostr (v2, audited by Cure53 Dec 2023)
- Uses ChaCha20-Poly1305 for authenticated encryption
- HKDF-SHA256 for key derivation from ECDH shared secret
- secp256k1 curve for elliptic curve Diffie-Hellman (ECDH)
- Conversation keys derived from sender private key + recipient public key
- Used internally by NIP-17 for gift-wrapped message encryption
- Implemented via nostr-tools library and NIP-07 signer extensions

### NIP-04 Legacy Support

- NIP-04 interface available in NostrSigner type definition
- Implemented in GenericAuthService (`encryptMessage`, `decryptMessage`, `supportsEncryption`)
- **Not actively used in production features** - all messaging uses NIP-17/NIP-44
- Maintained for potential backward compatibility with legacy DMs
- Extensions may provide nip04 methods, but app defaults to NIP-44
- Modern features use NIP-44 exclusively (audited by Cure53 Dec 2023)

### Relay Configuration

The application uses 8 high-reliability Nostr relays with comprehensive NIP support:

1. **relay.damus.io** - Damus relay (strfry) - supports NIP-01, 02, 04, 09, 11, 22, 28, 40
2. **relay.snort.social** - Snort Social relay (strfry) - supports NIP-01, 02, 04, 09, 11, 22, 28, 40
3. **relay.nostr.band** - Nostr.band explorer with search - supports NIP-01, 11, 15, 20, 33, 45, 50
4. **relay.primal.net** - Primal relay (strfry) - supports NIP-01, 02, 04, 09, 11, 22, 28, 40
5. **offchain.pub** - Reliable public relay (strfry) - supports NIP-01, 02, 04, 09, 11, 22, 28, 40
6. **shu01.shugur.net** - Enterprise HA cluster - supports 35+ NIPs including NIP-17, 23, 33, 44, 47, 52, 57, 59, 60, 61, 65, 72, 78
7. **relay.0xchat.com** - Dedicated NIP-17 messaging relay - optimized for private DMs
8. **relay.nostr.wirednet.jp** - Japan-based relay for Asia-Pacific coverage

**Multi-relay publishing** ensures redundancy - events published to all high-reliability relays simultaneously.

### Blossom Authentication

- Kind 24242 signed upload authorization events
- User-specific file namespaces (pubkey-based organization)
- SHA-256 content verification post-upload ensures data integrity
- Server-side signature validation before accepting uploads
- Prevents unauthorized file uploads or modifications

**Blossom Server Configuration:**

- **Primary strategy**: User-owned infrastructure (Nostr ethos)
  - Pattern: `https://{npub}.blossom.band/{hash}`
  - Fallback: `https://{npub}.blosstr.com/{hash}`
- **Shared servers** (fallback if user-owned fails):
  - `https://blossom.nostr.build` - Primary shared server
  - `https://blosstr.com` - Alternative shared server
- **File limits**: 100MB max file size, 10-second connection timeout
- **Supported formats**: Images (JPEG, PNG, WebP, GIF), Videos, Audio
- **Media metadata**: NIP-94 imeta tags for rich media information (dimensions, MIME type, size)

### Cache Encryption

- Uses pubkey for key derivation (not nsec, due to NIP-07 security model)
- PBKDF2 key derivation with 100k iterations for brute-force resistance
- AES-256-GCM encryption-at-rest protection for cached data
- Prevents casual browsing via browser DevTools
- Automatic cache clearing on sign-out for multi-user device security

## Future Enhancements

### Planned NIPs

- **NIP-09**: ✅ Event deletion (IMPLEMENTED in My Contributions feature)
- **NIP-11**: Relay capability discovery
- **NIP-23**: ✅ Long-form content for articles/posts (IMPLEMENTED in Contribute/Explore/My Contributions)
- **NIP-33**: ✅ Parameterized replaceable events (IMPLEMENTED in Contribute/Explore/My Contributions)
- **NIP-46**: Remote signer protocol (mobile apps, Nostr Connect)
- **NIP-65**: Relay list metadata (user's preferred relay list)

### Planned Feature Integration

- **Cart Storage**: Kind 30078 (NIP-78) for persistent cart data across sessions
  - Implemented: `NostrEventService.createSettingsEvent()` with unified app settings storage
  - Implemented: `NostrEventService.createCartEvent()` (legacy wrapper)
  - Architecture: Single event with d='nostr-for-nomads-settings' and multiple feature tags
  - Status: Service layer complete, UI integration pending
- **Meetups**: Event management system using Kind 30023
  - Can follow Shop/Work pattern for rapid development
  - Status: Not started
- **Lightning Zaps (NIP-57)**: Tip creators with Lightning Network
  - Relay support: shu01.shugur.net already supports NIP-57
  - Status: Planned for Q2 2025

### Media Enhancements

- ✅ Image uploads via Blossom (JPEG, PNG, WebP, GIF)
- ✅ Video uploads via Blossom (implemented in Work feature)
- ✅ Audio uploads via Blossom (implemented in Work feature)
- ✅ NIP-94 imeta tags for rich media metadata (dimensions, MIME type, size, hash)
- ✅ Multi-file upload progress tracking (implemented in services)
- ⏳ Thumbnail generation for video content (planned)
- ⏳ IPFS fallback URLs for decentralized media hosting (planned)

### Profile Enhancements

- ✅ NIP-05 verification - Real-time DNS verification with verified/unverified badges (implemented)
- ✅ Lightning addresses - lud16 (modern) and lud06 (LNURL) support (implemented)
- ✅ Image cropping - react-easy-crop for profile picture and banner (implemented)
- ✅ Profile cache - ProfileCacheService with 7-day TTL, LRU eviction (implemented)
- WebSocket profile updates - planned

## References

- [Nostr NIPs Repository](https://github.com/nostr-protocol/nips)
- [Blossom Protocol Spec](https://github.com/hzrd149/blossom)
- [Nostr Tools Library](https://github.com/nbd-wtf/nostr-tools)
- [Blossom Client SDK](https://github.com/hzrd149/blossom-client-sdk)

---

**Last Updated**: November 23, 2025  
**Codebase Version**: Next.js 15.4.6, React 18, nostr-tools 2.17.0, blossom-client-sdk 4.1.0
**Active NIPs**: 12 implemented (NIP-01, NIP-05, NIP-07, NIP-09, NIP-17, NIP-19, NIP-23, NIP-33, NIP-44, NIP-52, NIP-78, NIP-94 + Blossom)
**Active Event Kinds**: 10 kinds (Kind 0, 1, 5, 14, 1059, 24242, 30023, 30078, 31923, 31925)
**Production Features**: 14 features (Sign Up, Sign In, Profile, Messages, Explore, My Contributions, My Shop, Shop, My Work, Work, My Meet, Meet, User Event Log, Payments UI)
**Removed Features**: 1 feature (Travel)  
**Planned Features**: 1 feature (Cart)
**Major Refactors (Nov 2025)**:
- Moved `/contribute` → `/my-contributions/create` for pattern consistency
- Work edit architecture: Added `WorkUpdateService.ts` + `useWorkEditing` hook with selective attachment operations
- Meet edit refactor: Reduced `useMeetupEditing` from 171 lines to 56 lines (68% reduction) using generic pattern
- Statistics dashboards: Created reusable `StatCard` and `StatBreakdown` components, standardized all 4 My pages (Contributions/Shop/Work/Meet)
- Meet single-image design: Intentional limitation to one hero image per event (documented in meetup.ts config)

**Architecture**: Service-Oriented Architecture (SOA) with strict layer separation

- **Presentation Layer**: Pages, Components, Hooks
- **Business Logic Layer**: AuthBusinessService, ProfileBusinessService, MessagingBusinessService, ContributionService, ShopBusinessService, WorkService
- **Core Services Layer**: KVService, LoggingService, ProfileCacheService, MessageCacheService, EventLoggingService
- **Protocol/Data Layer**: GenericEventService, GenericRelayService, GenericBlossomService, GenericContributionService, GenericWorkService, GenericShopService, EncryptionService, NostrEventService, WorkValidationService, WorkContentService, ContributionValidationService, ContributionContentService
