# Nostr for Nomads

**Your Hub for the Nomadic Lifestyle**

A decentralized platform built on the Nostr protocol, enabling digital nomads to connect, work, travel, and trade with full ownership of their identity and data.

---

## 🌟 Features

### Production Features (Full Nostr Integration)

- **Messages** - Encrypted, peer-to-peer messaging with NIP-17 gift-wrapped DMs and NIP-44 encryption
- **Profile** - User metadata management with NIP-05 verification, Lightning addresses, and Blossom media uploads
- **Contribute** - Create and share nomad contributions using Kind 30023 parameterized replaceable events
- **Explore** - Discover community contributions with real-time relay queries and media galleries
- **My Contributions** - Full CRUD management dashboard for user's contributions with NIP-09 deletion support
- **Shop** - Decentralized marketplace for product listings using Kind 30023 events with multi-attachment support
  - Create, edit, delete products with NIP-09 deletion events
  - Multi-category support (Electronics, Fashion, Home, Sports, etc.)
  - Media uploads via Blossom (images, videos, audio)
  - Public browse page with filters (category, condition, price range)
  - My Shop dashboard for managing user products
  - Tag pattern: `nostr-for-nomads-shop` for discovery

### UI-Only Features (Coming Soon)

- **Gigs** - Decentralized job marketplace for freelancers and employers
- **Work** - Browse and post job opportunities with Bitcoin payments
- **Meetings** - Video conferencing and virtual collaboration
- **Payments** - Bitcoin and Lightning Network transactions
- **Travel** - Book accommodations, experiences, and transport
- **Meetups** - Find and organize local meetups with the Nostr community

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

- **NostrEventService**: Nostr event creation and formatting
- **GenericEventService**: Generic NIP-23/NIP-33 event building
- **GenericRelayService**: WebSocket relay management
- **GenericBlossomService**: Blossom media protocol (NIP-96)
- **GenericAuthService**: Cryptographic authentication
- **GenericContributionService**: Fetches and parses contribution events from Nostr relays
- **GenericMediaService**: Media upload and management
- **EncryptionService**: NIP-04 encrypted messaging
- **MultiFileProgressTracker**: Batch file upload tracking

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
│   ├── contribute/        # Community contribution page
│   ├── explore/           # Discover content and communities
│   ├── gigs/              # Gigs marketplace page
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
│   │   └── MessageCacheService.ts
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
│   │   ├── GenericMediaService.ts
│   │   ├── GenericRelayService.ts
│   │   ├── EncryptionService.ts
│   │   └── MultiFileProgressTracker.ts
│   │
│   └── nostr/            # Nostr protocol services
│       └── NostrEventService.ts
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

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/psam21/ncoin.git
cd ncoin

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

### Build for Production

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
- **NIP-17**: Private Direct Messages - gift-wrapped encrypted messages (double encryption) ✅
- **NIP-19**: Bech32-encoded entities - npub, nsec, note, nprofile, nevent ✅
- **NIP-23**: Long-form content - articles, blogs (used in Contribute/Explore) ✅
- **NIP-33**: Parameterized replaceable events - d-tag based content (used in Contribute/Explore) ✅
- **NIP-44**: Encrypted payloads (v2) - ChaCha20-Poly1305 + HKDF-SHA256 for NIP-17 encryption ✅
- **NIP-96**: Blossom protocol - decentralized media hosting with SHA-256 verification ✅

#### Available but Not Yet Used

- **NIP-09**: Event deletion - Kind 5 deletion events (service layer ready)
- **NIP-46**: Remote signer protocol - Nostr Connect for mobile apps

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

## 🤝 Contributing

Please read [Reference/critical-guidelines.md](Reference/critical-guidelines.md) before contributing.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow SOA architecture principles (see critical-guidelines.md)
4. Write and test your changes
5. Run `npm run build` to ensure no errors
6. Commit with concise messages (`git commit -m 'feat: Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Quality Standards

- **SOA Compliance**: Follow service-oriented architecture (mandatory)
- **TypeScript**: All code must be properly typed
- **Testing**: Test features end-to-end before marking complete
- **Documentation**: Add JSDoc comments for complex components
- **Linting**: Code must pass ESLint checks
- **No Dead Code**: Remove unused imports, functions, and files

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🔗 Resources

- [Nostr Protocol](https://github.com/nostr-protocol/nostr)
- [NIPs Repository](https://github.com/nostr-protocol/nips)
- [Next.js Documentation](https://nextjs.org/docs)
- [nostr-tools Documentation](https://github.com/nbd-wtf/nostr-tools)
- [Blossom Protocol Specification](https://github.com/hzrd149/blossom)

---

Built with ⚡ by nomads, for nomads
