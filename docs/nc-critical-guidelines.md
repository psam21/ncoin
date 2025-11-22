# CRITICAL GUIDELINES - NON-NEGOTIABLE

**FOR: All developers and AI agents working on this codebase**
**CONTEXT LIMIT FRIENDLY: Essential rules only. No exceptions.**

---

## 🚨 CARDINAL SINS (Never Do These)

### 1. ARCHITECTURE THEATER

**❌ Building code that looks right but doesn't work**

- Coding without testing = FAILURE
- "Complete" without proof = LYING
- Pretty code without functionality = WASTE
- Architecture only without working features = WRONG PRIORITY

**✅ THE FIX:**

- Build → Test → Verify → THEN mark complete
- Proof required: Event IDs, console logs, UI verification
- **NO SHORTCUTS. NO ASSUMPTIONS.**

### 1.5 INCOMPLETE VERIFICATION (NEW)

**❌ Checking compliance but not completeness**

**Problem:** Shop feature passed SOA/tag/service compliance checks BUT was missing:
- ❌ `updateProductWithAttachments()` function (edit flow broken)
- ❌ `parseImetaTag()`, `createMediaItemsFromImeta()` (no media metadata)
- ❌ `parseEventContent()`, `cleanLegacyContent()` (no backward compatibility)
- ❌ Type helper exports (no validation/parsing/constants)
- ❌ Wrong hook pattern (tight coupling vs generic wrapper)

**What Went Wrong:**
- Verified patterns (SOA ✅, tags ✅) but didn't verify **functionality**
- Checked "it follows guidelines" but didn't check "it works completely"
- Built new feature but didn't compare line-by-line with battle-tested reference

**✅ THE FIX - "VERIFY" MEANS:**

1. **Pattern Compliance** → Check SOA, tags, service reuse ✅
2. **Functional Completeness** → Compare ALL functions against reference (line count, missing helpers)
3. **CRUD Completeness** → Create ✅, Read ✅, Update ❌, Delete ✅ (all must work!)
4. **Reference Comparison** → Read BOTH implementations fully, document EVERY gap
5. **Missing Code Analysis** → Identify specific functions/helpers missing with line numbers

**MANDATORY: When asked to "verify against reference":**

- [ ] List all reference files (types, services, hooks, components, pages)
- [ ] List all implementation files
- [ ] Compare file-by-file with line counts
- [ ] Read BOTH files completely (not just grep)
- [ ] Document missing functions with code examples
- [ ] Test CRUD flows (Create, Read, Update, Delete)
- [ ] Document gaps with priority (critical/high/medium/low)
- [ ] Provide fix estimates (effort in hours)

**Red Flag: "Everything is compliant" without testing Update/Edit flow = INCOMPLETE**

### 2. SOA VIOLATIONS

**❌ Bypassing established service layers**

**CORRECT FLOW (NON-NEGOTIABLE):**

```text
Page → Component → Hook → Business Service → Event Service → Generic Service
```

**❌ WRONG (What heritage did):**

```text
Hook → Manually build events → Publish    // ARCHITECTURAL VIOLATION
```

**✅ THE FIX:**

- ALWAYS use service layers
- NEVER build events in hooks/components
- REUSE existing services (GenericEventService, NostrEventService)
- Follow shop pattern, not custom shortcuts

### 3. TAG SYSTEM CHAOS

**❌ Inventing your own tagging patterns**

**ESTABLISHED PATTERN (Use This):**

```typescript
// Event creation
['t', 'nostr-for-nomads-{content-type}']

// Query filter
{ kinds: [30023], '#t': ['nostr-for-nomads-{content-type}'] }
```

**❌ NEVER:**

- Invent new tag patterns without checking shop
- Use different discovery mechanisms per content type
- Create tags that aren't queryable

### 4. Dead Code Accumulation

**❌ Leaving unused code "just in case"**

- If it's not imported → DELETE
- If it's not called → DELETE
- If tests don't exist → DELETE or write tests
- "Future use" without clear plan → DELETE

**✅ THE FIX:**

- Grep for usage before keeping code
- Remove immediately when confirmed unused
- No orphaned utilities, no dead exports

### 5. MOCK/PLACEHOLDER IMPLEMENTATIONS

**❌ Shipping incomplete code**

- "Coming Soon" pages → NOT ACCEPTABLE
- Mock data without real implementation → NOT ACCEPTABLE
- Placeholder functions → NOT ACCEPTABLE
- "TODO" comments older than 1 sprint → NOT ACCEPTABLE

### 6. NAVIGATION INCONSISTENCY

**❌ Missing navigation links across mobile and desktop**

**Problem:** Building feature-complete pages but forgetting navigation creates:
- User confusion (feature exists but unreachable)
- Desktop/mobile inconsistency (mobile has links, desktop doesn't)
- Discovery failures (users can't find new features)
- Adoption blockers (type URL manually or switch to mobile)

**What Went Wrong (Meet Feature November 2025):**
- ✅ Built all 6 pages: `/meet`, `/meet/[id]`, `/my-meet`, `/my-meet/create`, `/my-meet/edit/[id]`, `/my-meet/rsvps`
- ✅ Built all 7 components, 6 hooks, services
- ✅ Tested functionality (RSVP system working)
- ❌ Desktop navigation ONLY had public links (Explore, Meet, Shop, Work)
- ❌ Desktop users couldn't access: My Meet, My Shop, My Work, My Contributions, Messages
- ❌ Mobile had full authenticated menu, desktop didn't → navigation parity violation

**Impact:**
- Desktop users had NO way to access their dashboards
- Had to switch to mobile view or type URLs manually
- Platform-wide issue: ALL authenticated features inaccessible on desktop
- Meet feature implementation exposed pre-existing navigation gap

**✅ THE FIX:**

**MANDATORY for EVERY new feature:**

1. **Add to Mobile Navigation** (Header.tsx mobile menu)
   - Public browse link (e.g., `/meet`)
   - Authenticated dashboard link (e.g., `/my-meet`)
   - Create link in authenticated section (e.g., `/my-meet/create`)

2. **Add to Desktop Navigation** (Header.tsx desktop nav bar)
   - Public browse link in main nav
   - Authenticated dashboard link conditionally rendered
   - Ensure consistent icon set, hover states, styling

3. **Verify Navigation Parity**
   - [ ] Mobile menu has all links
   - [ ] Desktop nav has equivalent access
   - [ ] Authenticated links use `{isAuthenticated && user && (...)}`
   - [ ] Icons consistent between mobile/desktop
   - [ ] Test both unauthenticated and authenticated states
   - [ ] Test on actual devices (mobile + desktop screens)

4. **Test Navigation Discovery**
   - [ ] Can unauthenticated users find public browse page?
   - [ ] Can authenticated users find their dashboard?
   - [ ] Can authenticated users find create page?
   - [ ] Are links visible in expected locations?
   - [ ] Do links work without manual URL typing?

**Red Flags (Navigation Violations):**
- 🚩 Feature complete but no navigation links added
- 🚩 Mobile has links but desktop doesn't (parity violation)
- 🚩 User has to type URL manually to access feature
- 🚩 "Feature complete" without testing navigation discovery
- 🚩 Desktop nav only shows public links for authenticated users

**The cardinal rule: A feature isn't complete until users can discover it through navigation. Desktop and mobile must have parity.**

---

## ⚡ MANDATORY WORKFLOW

### Build → Fix → Commit → Push → Verify

**EVERY. SINGLE. TIME.**

1. **Build:** `npm run build` (ALWAYS full build, NEVER pipe to tail/head/grep - catches ALL compile errors)
2. **Fix:** ALL errors first but iteratively, and then get to iteratively fixing warnings
3. **Commit:** use `git add .` with CONCISE commit message (auto-approves for faster push)
4. **Push:** `git push origin main`
5. **Verify:** User tests on https://nostrcoin.vercel.app and not localhost
6. **Confirm:** Get explicit confirmation before marking complete
7. **Avoid:** Creating new documentation without permission

**🚨 CRITICAL BUILD RULE:**

**✅ CORRECT:** `npm run build`
**❌ WRONG:** `npm run build 2>&1 | tail -30` or ANY piping variant
**❌ WRONG:** `npm run build | grep` or ANY filtering

**WHY:** Piping/filtering hides compile errors, wastes build cycles, increases infrastructure costs.
**PENALTY:** Missed errors cost time, money, and credibility. NO EXCEPTIONS.

**COMMIT MESSAGE FORMAT (SPEED vs. DETAIL):**

- **For Speed (Auto-Approved): Use CONCISE, single-line messages.**
  - Follows Conventional Commits format: `<type>: <subject>`
  - **GOOD:** `feat: Add user profile avatar upload`
  - **GOOD:** `fix: Correct price calculation in shop cart`
  - **GOOD:** `refactor: Unify ContributionCard components`
  - **WHY:** These are atomic, clear, and auto-approved for a rapid workflow. Use these for most changes.

- **For Detail (Manual Approval): Use multi-line messages ONLY for major changes.**
  - Use when a single line cannot capture the scope of a major refactor, new feature, or architectural change.
  - The body should explain the "why" and "what", not just list files.
  - **EXAMPLE (Requires Manual Approval):**

    ```typescript
    refactor: Unify all Card components across the app

    - Created `UnifiedDisplayCard` with variants for `contribution`, `product`, `event`.
    - Deduplicated ~600 lines of code from three different card components.
    - All pages now import the single unified card, improving maintainability.
    ```

  - **WHY:** This provides critical context for future developers but slows down the current workflow due to manual review. **Use sparingly.**

**Default to CONCISE messages for 99% of commits.**

**❌ NO SKIPPING STEPS**
**❌ NO ASSUMING IT WORKS**
**❌ NO "IT COMPILES SO IT'S DONE"**

---

## 🎯 CODE QUALITY COMMANDMENTS

### 1. Service-Oriented Architecture (SOA)

**Layers are LAW:**

- **UI Layer:** Pages, Components (display only)
- **Hook Layer:** State management, UI logic (no business logic)
- **Business Service Layer:** Orchestration, validation, workflows
- **Event Service Layer:** Nostr event creation/formatting
- **Generic Service Layer:** Reusable NIP-23 event building
- **Relay Service Layer:** Network communication

**Each layer talks ONLY to adjacent layers.**

### 2. Code Reuse First

**Before writing ANY new code:**

1. Search with full depth for existing implementations
2. Check GenericEventService for event creation
3. Check if shop or heritage does something similar
4. Reuse > Refactor > Create new

**The question: "Does this already exist?" is MANDATORY.**

### 3. Testing is Not Optional

**Definition of "Complete":**

- ✅ Code written
- ✅ Build succeeds
- ✅ Tested manually end-to-end
- ✅ User verified it works
- ✅ Proof exists (event ID, console logs, screenshots)

**Anything less = INCOMPLETE**

### 4. Documentation is Sacred

**When you touch architecture:**

- Document the pattern
- Explain WHY (Architecture Decision Record)
- Update relevant docs with permission
- Leave it better than you found it

---

## 🔥 HERITAGE SYSTEM LESSONS (Never Repeat)

### What Went Wrong

1. **No Architecture Review** → Built without checking shop pattern
2. **Took Shortcuts** → Bypassed service layers for "speed" → Technical debt
3. **Invented New Patterns** → Used `content-type` tag instead of `t` tag
4. **Built Events in Hooks** → Violated SOA, duplicated GenericEventService logic
5. **No Validation** → Skipped event validation that GenericEventService provides
6. **Dead Code Created** → createRevisionEvent() never used, revisionFilter.ts orphaned

### Remediation Applied

- ✅ Tag system aligned with shop pattern
- ⏳ Service layers being added (business + event)
- ⏳ Event creation moving to GenericEventService
- ⏳ Dead code removal in progress
- ⏳ Full architectural compliance required

### Prevention Rules

1. **MANDATORY:** Review shop pattern before implementing similar features
2. **MANDATORY:** Use GenericEventService.createNIP23Event() for all Kind 30023 events
3. **MANDATORY:** Architecture review for any new content type
4. **MANDATORY:** Follow SOA layers without exception
5. **FORBIDDEN:** Building events manually in hooks/components

---

## 💀 ANTI-PATTERNS (Instant Rejection)

### ❌ "It Compiles, Ship It"

**Problem:** TypeScript happy ≠ Feature working
**Fix:** Manual end-to-end testing REQUIRED

### ❌ "Works on My Machine"

**Problem:** Localhost ≠ Production
**Fix:** Test on https://nostrcoin.vercel.app ONLY

### ❌ "I'll Document Later"

**Problem:** Later = Never
**Fix:** Document AS YOU CODE or don't code at all; e.g. docs/nip-kind-implementation-matrix.md

### ❌ "Just One Little Shortcut"

**Problem:** Technical debt compounds
**Fix:** Do it right or don't do it

---

## 🛡️ DEFENSIVE CODING RULES

### 1. Never Trust Existing Code

- Read it
- Verify it works
- Test it yourself
- Ask user if uncertain

### 2. Never Assume State

- Check for null/undefined
- Validate all inputs
- Log extensively (console, not runtime)
- Handle errors explicitly

### 3. Never Skip Verification

- grep for imports before deleting
- Check usage before refactoring
- Verify queries return data
- Test ALL user paths

### 4. Never Bypass Validation

- Use existing validation utilities
- GenericEventService.validateEventForSigning()
- Business service validation methods
- Don't create events manually

---

## 📋 CHECKLIST FOR ANY NEW FEATURE

**Before writing a single line:**

- [ ] Does shop already do this? Study the pattern
- [ ] What services exist? Reuse them
- [ ] What's the SOA layer flow? Map it out
- [ ] Where does GenericEventService fit? Use it

**While coding:**

- [ ] Following SOA layers strictly
- [ ] Reusing existing services
- [ ] Using established tag patterns
- [ ] Adding extensive console logging
- [ ] No business logic in hooks/components

**Before committing:**

- [ ] `npm run build` succeeds
- [ ] All errors fixed
- [ ] Manual testing complete
- [ ] Proof collected (event IDs, logs)
- [ ] User verified it works
- [ ] Documentation updated
- [ ] **Navigation links added to mobile AND desktop** ← CRITICAL
- [ ] **Desktop/mobile navigation parity verified** ← CRITICAL

**After pushing:**

- [ ] Vercel deployment successful
- [ ] Production testing complete
- [ ] User confirmation received
- [ ] **Navigation discovery tested (users can find feature)** ← CRITICAL
- [ ] Feature marked complete

---

## 🚀 EFFICIENCY FOR AI AGENTS

### Context Window Optimization

**When you have limited context:**

1. **Read this file FIRST** - It contains critical patterns
2. **Check shop implementation** - It's the reference pattern
3. **Use grep aggressively** - Find before you build
4. **Reuse over create** - GenericEventService exists for a reason
5. **Test incrementally** - Don't batch changes

### Critical Questions to Ask BEFORE Coding

1. **Does this violate SOA?** → If yes, STOP
2. **Does shop do this?** → Study shop's approach
3. **Can I reuse existing services?** → Use them
4. **Is there a generic service?** → GenericEventService probably has it
5. **Have I verified existing code?** → Don't assume

### Red Flags (STOP Immediately)

- 🚩 Building events in a hook
- 🚩 Creating new tag patterns
- 🚩 Duplicating GenericEventService logic
- 🚩 Skipping service layers
- 🚩 Not testing before marking complete
- 🚩 Assuming code works without proof
- 🚩 Saying "verified" without testing CRUD flows (Create/Read/Update/Delete)
- 🚩 Comparing patterns but not comparing code line-by-line with reference
- 🚩 Missing ~300+ lines of code compared to reference but saying "complete"

---

## 🎓 LESSONS FROM FAILURES

### Heritage Implementation Failures

**Failure 1: Tag System Deviation**

- **What:** Used `content-type` tag instead of `t` tag pattern
- **Why:** Didn't check shop's established pattern
- **Fix:** Always review shop before implementing
- **Prevention:** Tag pattern is NOW standardized (see §3)

**Failure 2: SOA Bypass**

- **What:** Built events directly in useHeritagePublishing hook
- **Why:** Took shortcut instead of creating service layers
- **Fix:** Refactoring to use proper business/event services
- **Prevention:** SOA is NON-NEGOTIABLE (see §2)

**Failure 3: Code Duplication**

- **What:** Reimplemented GenericEventService.createNIP23Event() logic
- **Why:** Didn't check if event creation already existed
- **Fix:** Migrate to use GenericEventService
- **Prevention:** Code reuse first (see §2 of Code Quality)

**Failure 4: Dead Code**

- **What:** createRevisionEvent() created but never used
- **Why:** Planned feature abandoned, code not removed
- **Fix:** Deleting unused code + orphaned utilities
- **Prevention:** Delete unused code immediately (see §4)

**Failure 5: Shop "Verification" Incomplete (November 2025)**

- **What:** Verified SOA/tags/service reuse BUT didn't verify functional completeness
- **Why:** Focused on pattern compliance, didn't compare line-by-line with Heritage reference
- **Missing:** `updateProductWithAttachments()`, imeta parsing, content helpers, type exports, wrong hook pattern
- **Impact:** Edit flow broken, media metadata incomplete, no backward compatibility
- **Fix:** Comprehensive file-by-file comparison (23+ files), 314 lines of missing code identified
- **Prevention:** "Verify" = Pattern compliance + Functional completeness + CRUD testing + Reference comparison

### Architecture Theater Failure

**Failure:** Generic event service "complete" but never tested

- **What:** Built services, hooks, components
- **Why:** Focused on architecture over functionality
- **Fix:** Marked incomplete, went back, tested each piece
- **Prevention:** Test BEFORE marking complete (see Workflow)

---

## ⚖️ PRIORITY HIERARCHY (When in Doubt)

1. **SOA compliance** > Shortcuts (NON-NEGOTIABLE)
2. **User verification** > Your assumptions
3. **Code reuse** > Writing new code
4. **Testing** > Shipping
5. **Documentation** > Moving fast
6. **Proper architecture** > Quick hacks

---

## 🔒 SECURITY & DATA

- **NEVER** hardcode credentials such as user ids, npubs, nsecs
- **NEVER** access runtime logs
- **ALWAYS** use environment variables
- **ALWAYS** ask before showing user data
- **ALWAYS** implement proper access controls
- **ALWAYS** validate ALL inputs
- **ALWAYS** sanitize event content

---

## 🔐 SIGNER PRIORITY & IDENTITY ISOLATION

### Critical Rule

Multiple signing methods MUST NOT cause identity confusion

### Priority Order (Strictly Enforced)

When multiple signing methods are available in the browser:

1. **Priority 1: Nsec (Authenticated Users)**
   - If user authenticated with nsec → ALWAYS use nsec signer
   - Browser extension is COMPLETELY IGNORED
   - No fallback, no override, no exceptions
   
2. **Priority 2: Browser Extension (Extension-Only Sessions)**
   - If user authenticated via extension (no nsec) → Use extension signer
   - Only for users who signed in with extension button
   
3. **Priority 3: None (Not Authenticated)**
   - Extension detected but NOT activated until sign-in
   - Prevents premature permission prompts

### Implementation (useNostrSigner.ts)

```typescript
// Priority 1: Nsec takes absolute priority
if (nsec && nsecSigner && isAuthenticated && user) {
  // Use nsec signer, ignore extension completely
  setSigner(nsecSigner);
  return;
}

// Priority 2: Extension (only for extension-authenticated users)
if (window.nostr && isAuthenticated && user) {
  // Use extension signer
  setSigner(window.nostr);
  return;
}

// Priority 3: Not authenticated
// Extension available but not used
```

### User Scenarios

#### Scenario 1: User signs in with nsec, extension present

```text
✅ Nsec stored → User authenticated with nsec-derived pubkey
✅ Extension detected but IGNORED
✅ All operations use nsec signer
✅ User identity = nsec identity (consistent)
```

#### Scenario 2: User signs in with extension

```text
✅ No nsec stored → User authenticated with extension pubkey
✅ Extension used for all operations
✅ User identity = extension identity (consistent)
```

#### Scenario 3: User switches from extension to nsec

```text
✅ User logs out (clears extension session)
✅ User signs in with nsec
✅ Nsec stored → takes priority
✅ Extension ignored going forward
```

### Why This Matters

**Problem:** User signs in with nsec, but browser extension contains a DIFFERENT identity
**Without Priority:** App might accidentally use wrong signer → wrong pubkey → identity breach
**With Priority:** Nsec always wins → consistent identity → user intent preserved

### Security Guarantees

1. **No Identity Confusion:** Authenticated users NEVER have their signer switched
2. **Intent Preservation:** Sign-in method determines signer for entire session
3. **Extension Isolation:** Extension only accessible during sign-in for non-authenticated users
4. **Cross-Contamination Prevention:** Message cache, profiles, all keyed to authenticated pubkey

### Red Flags (Identity Violations)

- 🚩 Extension used when nsec is available
- 🚩 Signer switches mid-session
- 🚩 Multiple identities mixed in one session
- 🚩 Extension prompts for already-authenticated users
- 🚩 Cache shared between different user identities

### Testing Requirements

**Before marking signer implementation complete:**

- [ ] Test: User with extension signs in with nsec → nsec used
- [ ] Test: User with extension signs in with extension → extension used
- [ ] Test: User signs out and back in → same signer method used
- [ ] Test: Extension present but not authenticated → no prompts
- [ ] Verify: Message cache isolated per authenticated pubkey
- [ ] Verify: No signer switching mid-session

**The cardinal rule: Once authenticated, signer method is LOCKED for that session.**

---

## 📞 WHEN UNCERTAIN

**ASK. DON'T ASSUME.**

- Uncertain about pattern? → Check shop implementation
- Uncertain about architecture? → Follow SOA layers
- Uncertain about tags? → Use established pattern
- Uncertain about testing? → Ask user to verify
- Uncertain about deletion? → Grep for usage first
- Uncertain if "complete"? → Compare line-by-line with reference implementation
- Uncertain if "verified"? → Test ALL CRUD operations (Create/Read/Update/Delete)

**The cardinal rule: When in doubt, ask the user.**

**NEW RULE: Before saying "verified" or "complete":**

1. Have you tested Create? ✅
2. Have you tested Read? ✅
3. Have you tested Update/Edit? ⚠️ (THIS IS WHERE SHOP FAILED)
4. Have you tested Delete? ✅
5. Have you compared line counts with reference? (e.g., 865 lines vs 551 lines = 314 missing)
6. Have you listed ALL missing functions with code examples?
7. Have you tested on production (not localhost)?

---

## ✅ SUCCESS CRITERIA

**A feature is complete when:**

1. ✅ Follows SOA architecture
2. ✅ Reuses existing services
3. ✅ Uses established patterns (tags, events, etc.)
4. ✅ Builds without errors
5. ✅ Tested end-to-end manually
6. ✅ User verified on production
7. ✅ Proof exists (event IDs, logs)
8. ✅ Documentation updated
9. ✅ No dead code introduced
10. ✅ Committed and pushed

**Anything less = INCOMPLETE. No exceptions.**

---

## 🚨 EMERGENCY STOP CONDITIONS

**STOP all work immediately if:**

- ❌ You're building events outside service layer
- ❌ You're inventing new patterns without checking shop
- ❌ You're bypassing validation
- ❌ You're duplicating existing code
- ❌ You can't explain the SOA flow
- ❌ You haven't tested but want to mark complete

**STOP. Go back. Do it right.**

---

## 📚 REFERENCE IMPLEMENTATIONS

### ✅ CORRECT: Shop Product Creation

```text
useShopPublishing.ts (Hook)
  ↓ calls
ShopBusinessService.createProduct() (Business Layer)
  ↓ calls
NostrEventService.createProductEvent() (Event Layer)
  ↓ calls
GenericEventService.createNIP23Event() (Generic Layer)
  ↓ returns
Unsigned event → Sign → Publish
```

**Critical Patterns:**

- Uses `id = dTag` as stable identifier (persists across updates)
- NIP-33 alignment: dTag stays same, eventId changes on replacement
- `dTagPrefix: 'product'` generates IDs like `product-{timestamp}-{random}`
- Business service orchestrates, event service builds, generic service creates

**Study this. Replicate this. Don't deviate from this.**

### ✅ CORRECT: Heritage Contribution Creation

```text
useHeritagePublishing.ts (Hook)
  ↓ calls
HeritageContentService.createHeritageContribution() (Business Layer)
  ↓ calls
NostrEventService.createHeritageEvent() (Event Layer)
  ↓ calls
GenericEventService.createNIP23Event() (Generic Layer)
  ↓ returns
Unsigned event → Sign → Publish
```

**Critical Patterns:**

- Uses `id = dTag` as stable identifier (matches Shop pattern)
- `dTagPrefix: 'contribution'` generates IDs like `contribution-{timestamp}-{random}`
- Auto-redirects to detail page after successful publication (1 second delay)
- Follows same SOA architecture as Shop

**Status: ✅ Fully aligned with Shop pattern (as of 2025-10-03)**

### ✅ CORRECT: Profile Metadata Publishing

```text
useUserProfile.ts (Hook)
  ↓ calls
ProfileBusinessService.updateUserProfile() (Business Layer)
  ↓ calls
ProfileBusinessService.publishProfile() (Publishing)
  ↓ calls
GenericEventService.signEvent() + GenericRelayService.publishEvent() (Generic Layer)
  ↓ returns
Kind 0 metadata event → Publish to relays
```

**Critical Patterns:**

- Kind 0 metadata events (user profile information)
- Image upload + cropping workflow (react-easy-crop)
- Field-level validation with inline error display
- NIP-05 DNS-based verification (real-time status checking)
- Multi-relay publishing with partial failure handling
- Immediate publish after image upload (no explicit save needed)
- State propagation via auth store to all components

**Status: ✅ Production-ready (as of 2025-10-06)**

### ❌ WRONG: Manual Event Building (NEVER DO THIS)

```text
useCustomHook.ts (Hook)
  ↓ manually builds tags
  ↓ manually creates event object
  ↓ signs and publishes directly

NO business layer
NO event service
NO generic service usage
= ARCHITECTURAL VIOLATION
```

**Never do this. Always use service layers.**

---

## 🎯 THE BOTTOM LINE

1. **Follow SOA** - No exceptions (verified via comprehensive 2025-10 refactoring)
2. **Reuse services** - GenericEventService exists for a reason
3. **Test everything** - No assumptions
4. **Verify with user** - They decide when it's complete
5. **Document changes** - Leave it better than you found it (JSDoc mandatory)
6. **Delete dead code** - No orphaned utilities (enforcement: monthly audits)
7. **Use established patterns** - Check shop first
8. **Structured errors** - Use AppError with ErrorCode/Category/Severity
9. **No circular dependencies** - Service layers must remain independent
10. **Decorator pattern** - Use composition over duplication (see attachment hooks)

**This codebase has ZERO tolerance for:**

- Architecture violations (SOA bypass, circular dependencies)
- Untested code marked "complete"
- Pattern deviations without justification
- Dead code accumulation (verified: 270 lines removed Oct 2025)
- Shortcuts that create technical debt
- String-based error handling (use AppError)
- Missing documentation on complex components

**Work with discipline. Build with integrity. Ship with proof.**

**Code Quality Standards** (Established October 2025):

- ✅ All services stateless, SOA-compliant
- ✅ All hooks use AppError for error handling
- ✅ JSDoc required on all services, complex hooks, workflows
- ✅ Base classes for shared utilities (no duplication)
- ✅ Decorator pattern for hook composition
- ✅ No circular dependencies between layers


---

_Last Updated: November 16, 2025_  
_Status: ACTIVE - Mandatory compliance for all contributors_  
_Violations: Will be rejected and require immediate remediation_  
_Code Quality Audit: Completed 2025-10-12 (17/17 tasks, 100%)_  
_Shop Verification Lessons: Added 2025-11-16 (§1.5, Failure 5, Red Flags, WHEN UNCERTAIN)_
