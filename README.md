# Nostr for Nomads

**The Decentralized Super-App for Digital Nomads**

> *Your Identity. Your Network. Your Income. Your Data.*

A sovereign platform built on the Nostr protocol and Bitcoin Lightning Network, enabling 35 million digital nomads worldwide to connect, work, travel, and trade—without platform middlemen extracting 15-30% of your income.

**🌐 Live at [nostr.co.in](https://nostr.co.in)**

---

## 🎯 Mission

**End platform extraction. Enable true digital sovereignty.**

For 15 years, digital nomads have been promised "location independence"—but platforms like Airbnb, Upwork, and Instagram extract billions in fees, control your reach with algorithms, and can ban you overnight.

**Nostr for Nomads changes that:**
- ✅ **You own your identity** (cryptographic keys, not platform username)
- ✅ **You own your network** (portable followers, not captive audience)
- ✅ **You own your income** (0% fees, peer-to-peer payments via Lightning)
- ✅ **You own your data** (encrypted, not harvested for ads)

Built on battle-tested protocols (Nostr + Bitcoin), not venture-backed extraction machines.

---

## 📊 Market

- **35 million digital nomads** globally (growing 20% annually → 60M by 2030)
- **$1.2 trillion annual economy** ($200B+ in platform fees extracted yearly)
- **50+ countries** offering digital nomad visas (governments competing for talent)
- **Perfect timing**: Remote work normalized, platform trust collapsing, Bitcoin maturing

**We're building the infrastructure for what comes after platforms.**

---

## 🌟 Features

### ✅ Live in Production (Available Now)

**Core Identity & Communication**
- **🔐 Sovereign Identity** - NIP-05 verification, Lightning address, browser extension support (Alby, nos2x)
- **💬 Private Messaging** - NIP-17 gift-wrapped encryption (double-encrypted, E2E secure)
- **👤 Profile Management** - Custom avatars/banners via Blossom, full CRUD control

**The Nomad Tools**
- **📝 Contributions** (Share Your Journey)
  - Travel stories, location guides, cultural insights
  - 13 nomad categories × 195 countries coverage
  - Rich media support (images, video, audio)
  - NIP-33 parameterized replaceable events (fully editable)
  
- **🔍 Explore** (Discover Community Knowledge)
  - Real-time queries across 8 global relays
  - Filter by region, category, tags
  - Media galleries with full metadata
  
- **🛍️ Marketplace** (Commerce Without Middlemen)
  - List products/services with **0% commission**
  - 10 categories: Art, Services, Hardware, Software, Education, etc.
  - Multi-media listings (5 attachments per product)
  - Full shop management (My Shop dashboard)

**Technical Features**
- NIP-09 deletion events (true content control)
- Blossom protocol media storage (NIP-96)
- Multi-relay redundancy (censorship-resistant)
- Encrypted cache with 30-day TTL

**The Work Platform**
- **💼 Work Marketplace** (Live in Production)
  - Post freelance opportunities with **0% commission**
  - 10+ categories: Development, Design, Marketing, Writing, Consulting
  - Multi-media job listings (images, videos, audio)
  - Full CRUD operations (My Work dashboard)
  - Remote-first, location-flexible opportunities

**Meetups & Events**
- **🤝 Meet** (Live in Production)
  - Organize local meetups and events with **0% commission**
  - 6 types: Social Gathering, Workshop, Conference, Networking, Casual, Other
  - Virtual and in-person events with RSVP tracking
  - Full CRUD operations with generic edit architecture (My Meet dashboard)
  - NIP-52 calendar events (Kind 31923 + 31925) for time-based discovery
  - **Single hero image per event** (intentional design matching industry standards)
  - Statistics dashboard: Total/Upcoming/Past/RSVPs with reusable components
  - RSVP management with accepted/declined/tentative status

### 🚀 Coming Soon (6-12 Months)

- **💰 Work Escrow** - Lightning-based escrow for safe payments
- **🤝 Meetups** - Location-based events with RSVP and Lightning deposits
- **✈️ Travel Tools** - P2P accommodation booking, visa crowdsourcing
- **💰 Payments Hub** - Lightning wallet integration, invoicing, multi-currency
- **⚡ Zaps** - Lightning tips for creators (NIP-57)
- **🛒 Shopping Cart** - Multi-vendor cart with NIP-78 storage (service layer complete)
- **📱 Mobile Apps** - Native iOS & Android

---

## 🏗️ Tech Stack

### Frontend

- **Next.js 15.4.6** - React framework with App Router
- **React 18** - UI library with hooks and client components
- **TypeScript 5.5.4** - Type-safe development
- **Tailwind CSS 3.x** - Utility-first styling with @tailwindcss/typography
- **Lucide React** - Modern icon library
- **Framer Motion** - Animation library

### Nostr Integration

- **nostr-tools 2.17.0** - Nostr protocol implementation (NIPs 01, 05, 07, 17, 19, 23, 33, 44)
- **WebSocket** - Real-time relay connections to 8 high-reliability relays
- **Blossom Client SDK 4.1.0** - Decentralized media protocol (NIP-96)

### State Management

- **Zustand 5.0.8** - Lightweight state management
- **React Hooks** - Local component state
- **IndexedDB (idb 8.0.3)** - Client-side data persistence

### Rich Text & Communication

- **Tiptap 3.6.2** - Extensible rich text editor with extensions:
  - Character count, color, highlight, links
  - Tables, task lists, text alignment
  - Subscript, superscript, YouTube embeds
- **Tiptap Markdown** - Markdown conversion support
- **React Markdown** - Markdown rendering with remark-gfm

### Media & File Handling

- **Blossom Protocol** - Decentralized media storage (NIP-96)
- **React Easy Crop 5.5.3** - Image cropping and editing
- **Multi-file progress tracking** - Batch upload management

### Development Tools

- **ESLint 8.57** - Code linting with TypeScript support
- **Prettier 3.3** - Code formatting
- **PostCSS** - CSS processing with Autoprefixer
- **Vercel Analytics 1.5.0** - Performance monitoring
- **Upstash Redis 1.35.6** - Edge-compatible caching

---

## 🏛️ Architecture

### Service-Oriented Architecture (SOA)

The application follows a **layered Service-Oriented Architecture** with clear separation of concerns:

```text
┌─────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                   │
│  (Pages, Components, Hooks - User Interface)            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                   │
│         (Business Services - Domain Logic)               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     CORE SERVICES LAYER                  │
│   (Infrastructure Services - Technical Capabilities)     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   PROTOCOL/DATA LAYER                    │
│      (Nostr Services, External APIs, Storage)            │
└─────────────────────────────────────────────────────────┘
```

### Layer Breakdown

#### 1. **Presentation Layer** (`/src/app`, `/src/components`, `/src/hooks`)

- **Responsibility**: User interface, routing, user interactions
- **Components**:
  - Pages (Next.js App Router)
  - Reusable UI components (primitives, pages, auth)
  - Custom React hooks for state and side effects
- **Key Principle**: Presentation components are thin and delegate business logic to services

#### 2. **Business Logic Layer** (`/src/services/business`)

Encapsulates domain-specific business rules and workflows:

- **AuthBusinessService**: Authentication flows, key management, sign-up/sign-in
- **MessagingBusinessService**: Message composition, threading, NIP-17/NIP-44 encryption
- **ProfileBusinessService**: Profile management, validation, NIP-05 verification
- **MediaBusinessService**: Media upload orchestration, Blossom integration
- **MessageCacheService**: Message caching with 30-day TTL and adaptive sync
- **ContributionService**: Contribution creation, validation, and publishing
- **ContributionValidationService**: Field-level validation for contributions
- **ContributionContentService**: Content provider interface for contributions
- **ShopBusinessService**: Product marketplace logic, multi-attachment management
- **WorkService**: Work opportunity posting and discovery orchestration

**Key Characteristics**:

- Contains domain logic (e.g., "how to create a user profile")
- Orchestrates multiple core services
- Validates business rules
- Independent of UI frameworks

#### 3. **Core Services Layer** (`/src/services/core`)

Provides technical infrastructure capabilities:

- **EventLoggingService**: System event tracking and logging
- **KVService**: Key-value storage abstraction
- **LoggingService**: Application-wide logging
- **ProfileCacheService**: Profile data caching
- **CacheEncryptionService**: Encrypted cache management

**Key Characteristics**:

- Framework-agnostic utilities
- Reusable across different features
- Technical concerns (logging, caching, storage)
- No business domain knowledge

#### 4. **Protocol/Data Layer** (`/src/services/nostr`, `/src/services/generic`)

Handles external protocols and data sources:

- **NostrEventService**: Nostr event creation and formatting (Kind 0, 1, 5, 14, 1059, 24242, 30023, 30078, 31923, 31925)
- **GenericEventService**: Generic NIP-23/NIP-33 event building
- **GenericRelayService**: WebSocket relay management (8 high-reliability relays)
- **GenericBlossomService**: Blossom media protocol (NIP-96)
- **GenericAuthService**: Cryptographic authentication
- **GenericContributionService**: Fetches and parses contribution events from Nostr relays
- **GenericShopService**: Product event parsing with NIP-94 imeta tag support
- **GenericWorkService**: Work opportunity event queries and parsing
- **GenericMediaService**: Media upload and management
- **EncryptionService**: NIP-44 encrypted messaging
- **MultiFileProgressTracker**: Batch file upload tracking
- **WorkValidationService**: Work opportunity field validation
- **WorkContentService**: Work content detail provider

**Key Characteristics**:

- Direct protocol implementation
- Network communication
- Data persistence
- External API integration

---

## 🔐 Service Segregation Principles

### 1. **Separation of Concerns**

Each service has a **single, well-defined responsibility**:

```typescript
// ❌ BAD: Mixed concerns
class MessageService {
  sendMessage() { /* business logic + Nostr protocol + UI updates */ }
}

// ✅ GOOD: Separated concerns
class MessagingBusinessService {
  async sendMessage(content: string) {
    // Business logic only
    const validated = this.validateMessage(content);
    const encrypted = await this.encryptionService.encrypt(validated);
    return this.nostrService.publishEvent(encrypted);
  }
}
```

### 2. **Dependency Injection**

Services depend on abstractions, not concrete implementations:

```typescript
// Business service depends on core service interface
class MessagingBusinessService {
  constructor(
    private nostrService: GenericNostrService,
    private encryptionService: EncryptionService,
    private cacheService: MessageCacheService
  ) {}
}
```

### Layered Dependencies

**Strict dependency rules**:

- Presentation → Business Logic → Core Services → Protocol Layer
- **Never** reverse direction (e.g., Core cannot depend on Business)
- Horizontal communication within same layer is allowed

```text
Page Component
    ↓ uses
MessagingBusinessService
    ↓ uses
GenericNostrService + EncryptionService
    ↓ uses
WebSocket API / Crypto API
```

### 4. **Service Isolation**

Each service is **independently testable** and **replaceable**:

```typescript
// Can mock dependencies for testing
const mockNostrService = { publishEvent: jest.fn() };
const messagingService = new MessagingBusinessService(mockNostrService);

// Can swap implementations without changing consumers
const realNostrService = new GenericNostrService();
const prodMessagingService = new MessagingBusinessService(realNostrService);
```

### 5. **State Management Segregation**

- **Zustand stores** (`/src/stores`): Global application state (auth, UI)
- **Service state**: Internal service state (connection pools, caches)
- **Component state**: Local UI state (forms, toggles)

```typescript
// Global auth state
useAuthStore() // Zustand

// Service manages its own connection state
GenericRelayService.relayConnections // Internal

// Component manages UI state
const [isOpen, setIsOpen] = useState(false) // Local
```

---

## 📁 Directory Structure

```text
/src
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes (event logging)
│   ├── my-contributions/  # User's contributions management
│   │   ├── create/        # Create new contribution
│   ├── explore/           # Discover content and communities
│   ├── work/              # Work marketplace page
│   ├── meetups/           # Local meetup organizer
│   ├── messages/          # Messaging page
│   ├── meetings/          # Video meetings page
│   ├── payments/          # Payment management page
│   ├── profile/           # User profile page
│   ├── shop/              # Shopping marketplace page
│   ├── travel/            # Travel booking page
│   ├── work/              # Job board page
│   ├── signin/            # Authentication page
│   ├── signup/            # Registration page
│   ├── user-event-log/    # Event logging dashboard
│   └── layout.tsx         # Root layout
│
├── components/            # React components
│   ├── auth/             # Authentication UI (flows, steps, signer)
│   ├── generic/          # Reusable components (layouts, dialogs)
│   ├── meetings/         # Meeting components (dashboard, URL creator)
│   ├── pages/            # Feature-specific components (messages, events)
│   ├── primitives/       # Base UI primitives (skeleton, ratings, stats)
│   ├── profile/          # Profile-specific UI (image upload, cropper)
│   ├── ui/               # Common UI elements (rich text, markdown)
│   ├── Header.tsx        # Global header navigation
│   └── Footer.tsx        # Global footer
│
├── hooks/                # Custom React hooks
│   ├── useAuthHydration.ts
│   ├── useConsentDialog.ts
│   ├── useConversations.ts
│   ├── useMediaUpload.ts
│   ├── useMessages.ts
│   ├── useMessageSending.ts
│   ├── useNostrSigner.ts
│   ├── useNostrSignIn.ts
│   ├── useNostrSignUp.ts
│   └── useUserProfile.ts
│
├── services/             # Service layer (SOA)
│   ├── business/         # Business logic services
│   │   ├── AuthBusinessService.ts
│   │   ├── MessagingBusinessService.ts
│   │   ├── ProfileBusinessService.ts
│   │   ├── MediaBusinessService.ts
│   │   ├── MessageCacheService.ts
│   │   ├── ContributionService.ts
│   │   ├── ContributionValidationService.ts
│   │   ├── ContributionContentService.ts
│   │   ├── ShopBusinessService.ts
│   │   └── WorkService.ts
│   │
│   ├── core/             # Infrastructure services
│   │   ├── EventLoggingService.ts
│   │   ├── KVService.ts
│   │   ├── LoggingService.ts
│   │   ├── ProfileCacheService.ts
│   │   └── CacheEncryptionService.ts
│   │
│   ├── generic/          # Generic utilities
│   │   ├── GenericAuthService.ts
│   │   ├── GenericBlossomService.ts
│   │   ├── GenericEventService.ts
│   │   ├── GenericContributionService.ts
│   │   ├── GenericShopService.ts
│   │   ├── GenericWorkService.ts
│   │   ├── GenericMediaService.ts
│   │   ├── GenericRelayService.ts
│   │   ├── EncryptionService.ts
│   │   └── MultiFileProgressTracker.ts
│   │
│   └── nostr/            # Nostr protocol services
│       ├── NostrEventService.ts
│       ├── WorkValidationService.ts
│       └── WorkContentService.ts
│
├── stores/               # Zustand state management
│   └── useAuthStore.ts   # Global auth state
│
├── types/                # TypeScript type definitions
│   ├── attachments.ts
│   ├── messaging.ts
│   └── nostr.ts
│
├── utils/                # Utility functions
│   ├── keyManagement.ts
│   ├── keyExport.ts
│   ├── signerFactory.ts
│   ├── profileValidation.ts
│   ├── nip05.ts
│   └── tagFilter.ts
│
├── config/               # Configuration files
│   ├── relays.ts
│   ├── blossom.ts
│   └── media.ts
│
├── errors/               # Error handling
│   ├── AppError.ts
│   └── ErrorTypes.ts
│
└── styles/               # Global styles
    ├── globals.css
    └── tiptap.css
```

---

## 🔄 Data Flow Example: Sending a Message

Demonstrates how SOA layers interact:

```typescript
// 1. USER INTERACTION (Presentation Layer)
// Component: MessageComposer.tsx
const handleSend = async () => {
  await messagingBusinessService.sendMessage(content, recipientPubkey);
}

// 2. BUSINESS LOGIC (Business Layer)
// MessagingBusinessService.ts
async sendMessage(content: string, recipient: string) {
  // Validate business rules
  if (!this.validateRecipient(recipient)) throw new Error();
  
  // Orchestrate core services
  const encrypted = await this.encryptionService.encrypt(content, recipient);
  const event = await this.eventService.createDirectMessage(encrypted);
  
  // Publish via protocol layer
  await this.nostrService.publishEvent(event);
  
  // Update cache
  await this.cacheService.cacheMessage(event);
  
  return event;
}

// 3. CORE SERVICES (Core Layer)
// EncryptionService.ts
async encrypt(plaintext: string, pubkey: string) {
  // NIP-04 encryption logic
  return await nip04.encrypt(this.privateKey, pubkey, plaintext);
}

// 4. PROTOCOL LAYER (Data Layer)
// GenericNostrService.ts
async publishEvent(event: NostrEvent) {
  // Send to all connected relays
  for (const relay of this.relays) {
    await relay.publish(event);
  }
}
```

---

## 💼 Business Model

### Phase 1: Growth (Current - 12 Months)
- **100% FREE** - No subscriptions, no transaction fees, no ads
- Focus: Reach 100,000 active users (critical mass for network effects)

### Phase 2: Freemium (12-24 Months)
- **Free Tier**: All core features, 5 shop listings, 10 contributions
- **Creator Tier**: 10,000 sats/month (~$10) - Unlimited listings, analytics, featured placement
- **Pro Tier**: 50,000 sats/month (~$50) - Verified badge, custom domain, API access

### Phase 3: Platform Services (24+ Months)
- Featured listings, promoted content, event promotion
- Partnership revenue (coworking spaces, travel services, nomad visas)
- Enterprise white-label deployments

**Path to $10M ARR**: 100K users × 5% paid × $100/year avg = $500K ARR (Year 1) → $10M+ (Year 3)

---

## 📄 Documentation

- **[Investor Pitch Deck](docs/Nostr-for-Nomads-Deck.md)** - Comprehensive 60-slide deck (market, product, business model, financials)
- **[Critical Guidelines](docs/nc-critical-guidelines.md)** - Development principles and SOA architecture rules
- **[NIP Implementation Matrix](docs/nc-nip-kind-implementation-matrix.md)** - Nostr protocol implementation status

---

## 🚀 Getting Started

### For Users

**Try it now:** [nostr.co.in](https://nostr.co.in)

1. Sign in with browser extension (Alby, nos2x) OR generate new keys
2. Complete your profile (add Lightning address for payments)
3. Start exploring contributions or list your first product

**Sign-up takes 30 seconds. No email. No KYC. Just keys.**

### For Developers

**Prerequisites**
- Node.js 18+
- npm or yarn

**Installation**

```bash
# Clone the repository
git clone https://github.com/psam21/NostrForNomads.git
cd NostrForNomads

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

**Build for Production**

```bash
npm run build
npm start
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server

# Building
npm run build            # Production build
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix linting issues
npm run lint:prod        # Lint with production rules
npm run format:check     # Check code formatting
npm run format           # Format code with Prettier
npm run typecheck        # TypeScript type checking

# Utilities
npm run metrics:export   # Export application metrics
npm run bench:signing    # Benchmark signing performance
npm run enrich:nostr     # Enrich Nostr handles
```

---

## 🔑 Key Nostr Concepts

### NIPs (Nostr Implementation Possibilities)

#### Implemented NIPs

- **NIP-01**: Basic protocol - events, signatures, relays ✅
- **NIP-05**: DNS-based verification - `alice@example.com` identifiers ✅
- **NIP-07**: Browser extension signing - `window.nostr` interface (Alby, nos2x, Nostore) ✅
- **NIP-09**: Event deletion - Kind 5 deletion events (used in My Contributions, My Shop, My Work) ✅
- **NIP-17**: Private Direct Messages - gift-wrapped encrypted messages (double encryption) ✅
- **NIP-19**: Bech32-encoded entities - npub, nsec, note, nprofile, nevent ✅
- **NIP-23**: Long-form content - articles, blogs (used in Contribute/Explore/Shop/Work) ✅
- **NIP-33**: Parameterized replaceable events - d-tag based content (used in Contribute/Explore/Shop/Work) ✅
- **NIP-44**: Encrypted payloads (v2) - ChaCha20-Poly1305 + HKDF-SHA256 for NIP-17 encryption ✅
- **NIP-78**: Application-specific data - Kind 30078 for cart/settings storage (service layer ready) ✅
- **NIP-94**: File metadata - imeta tags for media attachments ✅
- **NIP-96**: Blossom protocol - decentralized media hosting with SHA-256 verification ✅

#### Planned for Future Integration

- **NIP-11**: Relay capability discovery
- **NIP-46**: Remote signer protocol - Nostr Connect for mobile apps
- **NIP-57**: Lightning Zaps - tip creators
- **NIP-65**: Relay list metadata - user's preferred relay list

### Relays

The application connects to multiple Nostr relays for redundancy:

- Default relays configured in `/src/config/relays.ts`
- WebSocket-based real-time communication
- Automatic reconnection and failover
- Multi-relay publishing for redundancy

### Key Management

- **Private keys**: Stored securely in browser (encrypted localStorage via KVService)
- **Public keys**: User identity (npub format)
- **Signing**: All events cryptographically signed (ed25519)
- **Backup**: Exportable key backup files (keyExport utility)
- **Browser extension**: NIP-07 compatible (Alby, nos2x, etc.)

---

## 🧪 Testing Strategy

### Unit Tests

- Service layer methods (business logic in isolation)
- Utility functions (key management, validation)
- Core services (caching, encryption)

### Integration Tests

- Service composition (business → core → protocol)
- Nostr event flow
- Authentication workflows

### E2E Tests

- User journeys (signup, messaging, profile updates)
- Cross-feature workflows

---

## 🛡️ Security Considerations

- **Client-side encryption**: Messages encrypted before transmission (NIP-04)
- **No password storage**: Nostr uses cryptographic key pairs (ed25519)
- **Relay privacy**: Users can choose their own relays
- **Censorship resistance**: Decentralized architecture with multi-relay publishing
- **Key backup**: User-controlled key management with export functionality
- **Encrypted caching**: Sensitive data encrypted in browser storage (CacheEncryptionService)
- **Event validation**: All events validated before signing (GenericEventService)
- **Content sanitization**: User input sanitized to prevent XSS attacks

---

## 📝 Environment Variables

```bash
# Nostr Relays (comma-separated WebSocket URLs)
NEXT_PUBLIC_DEFAULT_RELAYS=wss://relay1.example.com,wss://relay2.example.com

# Blossom Media Server
NEXT_PUBLIC_BLOSSOM_SERVER=https://blossom.example.com

# Analytics (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Redis/Upstash (for server-side caching, optional)
UPSTASH_REDIS_REST_URL=https://your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Environment
APP_ENV=production # or development
```

---

## 🎯 Why This Matters

**This isn't just a startup. This is a movement.**

### The Broken Promise

For 15 years, we've been told:
- "Work from anywhere!"
- "Travel the world!"
- "Live on your terms!"

**The Reality:**
- Platforms extract 15-30% of your income
- Algorithms control your reach
- Accounts vanish overnight
- Reputation trapped on each platform
- Data sold to advertisers

### The Solution

**Nostr for Nomads is what digital nomadism should have been from the start:**

| Traditional Platforms | Nostr for Nomads |
|----------------------|------------------|
| Username = platform property | Cryptographic keys = yours forever |
| Followers locked to platform | Portable across any Nostr app |
| Can be deleted/censored | Signed by your key = permanent |
| Reputation starts at zero | Travels with your public key |
| 10-30% fees | 0% today, <5% future |
| Data sold | Encrypted, you control |

**We're not just replacing platforms. We're making them obsolete.**

---

## 🤝 Contributing

**Read [docs/nc-critical-guidelines.md](docs/nc-critical-guidelines.md) before contributing.**

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow SOA architecture principles (mandatory - see critical-guidelines.md)
4. Write and test your changes
5. Run `npm run build` to ensure no errors
6. Commit with concise messages (`git commit -m 'feat: Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Quality Standards

- **SOA Compliance**: Follow service-oriented architecture (non-negotiable)
- **TypeScript**: All code must be properly typed
- **Testing**: Test features end-to-end before marking complete
- **Documentation**: Add JSDoc comments for complex components
- **Linting**: Code must pass ESLint checks (`npm run lint`)
- **No Dead Code**: Remove unused imports, functions, and files

### Want to Help?

- **Developers**: Check GitHub issues tagged `good-first-issue`
- **Designers**: UI/UX improvements always welcome
- **Nomads**: User feedback, bug reports, feature requests
- **Writers**: Documentation, guides, tutorials
- **Investors**: See [docs/Nostr-for-Nomads-Deck.md](docs/Nostr-for-Nomads-Deck.md)

---

## 📊 Project Status

**Current Phase**: Production MVP with active users

**Metrics (as of November 2025)**
- ✅ 12 NIPs implemented (01, 05, 07, 09, 17, 19, 23, 33, 44, 52, 78, 94, 96)
- ✅ 10 Event kinds (Kinds 0, 1, 5, 14, 1059, 24242, 30023, 30078, 31923, 31925)
- ✅ 14 Features in production (Sign Up, Sign In, Profile, Messages, Explore, My Contributions, My Shop, Shop, My Work, Work, My Meet, Meet, User Event Log, Payments UI)
- ✅ 8 high-reliability global relays integrated
- ✅ Service-Oriented Architecture (4-layer design with 25+ services)
- ✅ Production deployment on Vercel
- ✅ 99.9% uptime target
- ✅ Full CRUD with generic edit architecture for Shop, Work, Meet, and Contributions
- ✅ Standardized statistics dashboards across all My pages (reusable StatCard/StatBreakdown components)
- ✅ Selective attachment operations for multi-image features (Contributions/Shop/Work)
- ✅ Single-image design for Meet events (intentional, industry-standard pattern)
- 🚀 Early adopter user base growing
- 🚀 Community feedback driving roadmap

**Next Milestones**
- Q1 2026: Freemium launch (Creator/Pro tiers)
- Q2 2026: Mobile apps (iOS + Android)
- Q3 2026: Work marketplace with Lightning escrow
- Q4 2026: 100,000 active users

---

## 💰 Funding

**Seeking $500K seed round** to:
- Hire core team (3 engineers, 1 designer, 1 growth lead)
- Scale to 100,000 users
- Achieve product-market fit in 12-18 months
- Position for Series A

**Investment highlights:**
- Working product (not vaporware)
- Massive TAM ($1.2T nomad economy)
- Protocol moat (network effects = defensibility)
- Path to $10M ARR in 3 years
- 100-400x return potential

**Contact**: contact@nostr.co.in | [Read full pitch deck](docs/Nostr-for-Nomads-Deck.md)

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🔗 Resources

**Nostr Protocol**
- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [NIPs Repository](https://github.com/nostr-protocol/nips)
- [nostr-tools Documentation](https://github.com/nbd-wtf/nostr-tools)

**Bitcoin & Lightning**
- [Lightning Network](https://lightning.network/)
- [WebLN API](https://www.webln.guide/)
- [Bitcoin Developer Resources](https://developer.bitcoin.org/)

**Tech Stack**
- [Next.js Documentation](https://nextjs.org/docs)
- [Blossom Protocol Specification](https://github.com/hzrd149/blossom)
- [Zustand State Management](https://github.com/pmndrs/zustand)

**Community**
- [Nostr for Nomads on Nostr](https://nostr.co.in)
- [GitHub Issues](https://github.com/psam21/NostrForNomads/issues)
- [Pitch Deck](docs/Nostr-for-Nomads-Deck.md)

---

**Built with ⚡ by nomads, for nomads**

*35 million digital nomads are waiting for this. Let's build it.*
