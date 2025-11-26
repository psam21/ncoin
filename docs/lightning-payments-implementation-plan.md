# Lightning Payments Implementation Plan
**Project:** Nostr for Nomads (ncoin)  
**Date:** November 24, 2025  
**Status:** Pre-Implementation Review

---

## Executive Summary

Implement Lightning Network payments for Shop and Work features using a **multi-method, no-custody approach** that maximizes user coverage (95%+) without backend infrastructure complexity. Core strategy: client-side payment initiation + custom Lightning address proxy + strategic zero-fee partnerships.

**Key Metrics:**
- **Coverage:** WebLN (0.4% desktop power users) + Lightning Links (60% mobile) + QR Codes (35% any device) + Manual Copy/Paste (100% fallback)
- **Cost:** $0/month infrastructure (vs $100-500/month self-hosted)
- **Custody Risk:** Zero (users control their own wallets)

---

## Phase 1: Custom Lightning Address Proxy (Priority: HIGH)

### Objective
Enable branded Lightning addresses (`user@nostr.co.in`) that forward to users' actual wallet addresses (`user@primal.net`, `user@getalby.com`, etc.) without custody.

### Technical Implementation

**API Route:** `/src/app/api/.well-known/lnurlp/[username]/route.ts`
- Fetch user's actual Lightning address from profile
- Proxy request to actual wallet's `.well-known` endpoint
- Return LNURL-pay metadata with nostr.co.in branding
- ~30 lines of code

**Next.js Rewrite:** Configure `next.config.js` to handle `.well-known` routes properly

**Profile Schema:** Add `forwardToLightningAddress` field to user profiles for backend forwarding configuration

**UI Component:** Profile settings page input for users to configure their actual Lightning address

### Benefits
- ✅ Portability: Change wallets without updating public profiles
- ✅ Branding: Professional custom domain
- ✅ Zero custody: Payments flow directly to user's wallet
- ✅ Universal compatibility: Works with all Lightning wallets
- ✅ No ongoing costs

### Testing Checklist
- [ ] Test with Primal wallet address
- [ ] Test with Alby wallet address
- [ ] Test with Strike wallet address
- [ ] Verify invoice generation works
- [ ] Test payment completion flow
- [ ] Validate error handling (invalid usernames, missing addresses)

---

## Phase 2: Multi-Method Payment Integration (Priority: HIGH)

### Objective
Support multiple payment methods to cover 95%+ of users across desktop and mobile devices.

### Method 1: WebLN (Desktop Browser Extensions)
**Coverage:** 0.4% power users with Alby/Zeus extensions  
**Implementation:** `window.webln.sendPayment(invoice)`  
**Use Case:** Instant one-click payments for desktop users  
**Fallback:** Auto-detect availability, show alternative methods if unavailable

### Method 2: Lightning Links (Mobile Apps)
**Coverage:** 60% mobile users with Lightning wallets installed  
**Implementation:** `lightning:{invoice}` URI scheme  
**Use Case:** Deep-link to mobile wallet apps (Zeus, Phoenix, Wallet of Satoshi)  
**Fallback:** If app not installed, show QR code

### Method 3: QR Codes (Universal)
**Coverage:** 35% users who prefer scanning  
**Implementation:** Generate QR from `lightning:{invoice}` URI  
**Use Case:** Cross-device payments, point-of-sale scenarios  
**Fallback:** Display invoice string below QR for manual copy/paste

### Method 4: Manual Copy/Paste (Fallback)
**Coverage:** 100% guaranteed  
**Implementation:** Copyable invoice text + one-click copy button  
**Use Case:** When all else fails, works everywhere  
**Fallback:** N/A - this IS the fallback

### Architecture Components

**Service Layer:** `GenericLightningService.ts`
- `fetchInvoice(lightningAddress, amountSats)` - LNURL-pay protocol
- `parseInvoice(bolt11)` - Extract amount, description, expiry
- `validateInvoice(bolt11)` - Check format and expiration

**Hook:** `useLightningPayment.ts`
- WebLN detection: `window.webln?.enabled`
- Mobile detection: User agent parsing
- Method priority selection logic
- Payment status polling (optional via Nostr events)

**UI Components:**
- `PaymentMethodSelector.tsx` - Radio buttons for method selection
- `WebLNPayButton.tsx` - One-click WebLN payments
- `LightningQRCode.tsx` - QR code display with copy button
- `InvoiceDisplay.tsx` - Manual copy/paste fallback

### Payment Flow
```
1. User clicks "Buy" on product → Opens payment modal
2. Detect available methods (WebLN? Mobile? Desktop?)
3. Show preferred method first, alternatives below
4. User selects method → Generate invoice from seller's Lightning address
5. Execute payment:
   - WebLN: sendPayment() → Success/failure callback
   - Mobile: Open lightning: link → Return to app (manual verification)
   - QR: Display code → User scans → Manual verification
   - Manual: Copy invoice → User pays in wallet → Manual verification
6. Seller monitors wallet for payment → Marks order complete
```

### Integration Points
- **Shop Product Detail:** Add "Pay with Lightning" button below price
- **Work Application Payment:** Lightning option in payment method selector
- **Profile Tipping:** Quick zap button with preset amounts (optional Phase 4)

---

## Phase 3: Zero-Fee Payment Corridors (Priority: MEDIUM)

### Objective
Partner with wallet providers to offer **0% fee transactions** when both buyer and seller use the same wallet, creating competitive advantage and reducing costs for users.

### Fee Landscape Analysis
| Wallet | Standard Send Fee | Internal Transfer Fee | Partner Opportunity |
|--------|-------------------|----------------------|---------------------|
| Primal | 1% | 0% (Primal-to-Primal) | HIGH - Already built-in |
| Alby | ~0.5% | 0% (Alby-to-Alby) | HIGH - Developer-friendly |
| Strike | Free (USD) | 0% (Strike-to-Strike) | MEDIUM - US-focused |
| Wallet of Satoshi | ~1% | 0% (WoS-to-WoS) | LOW - Closed ecosystem |

### Partnership Strategy

**Target Partners (Priority Order):**
1. **Alby** - Developer-focused, API-friendly, Nostr ecosystem aligned
2. **Primal** - Already Nostr-native, large user base, internal transfers free
3. **Strike** - Zero-fee model for fiat pairs, good for USD markets

**Value Proposition:**
- Co-marketing: Feature partner wallets prominently in UI
- User acquisition: Drive signups to partner wallets via zero-fee incentive
- Data sharing: Provide anonymized transaction volume metrics
- Referral revenue: Affiliate links for new wallet signups

**Technical Implementation:**

**Detection Logic:** Check if buyer and seller Lightning addresses match domain
```typescript
const buyerDomain = buyerAddress.split('@')[1]; // 'primal.net'
const sellerDomain = sellerAddress.split('@')[1]; // 'primal.net'
const isZeroFee = buyerDomain === sellerDomain && ZERO_FEE_PARTNERS.includes(sellerDomain);
```

**UI Elements:**
- 🟢 **"0% FEE"** badge prominently displayed when detected
- Explanatory tooltip: "Free transfer because you both use {Wallet}"
- Product listings: Filter/sort by "Zero-fee available" (when logged in)
- Wallet recommendation banner: "Save 1% on all purchases - use {Wallet}"

**Partner Integration Requirements:**
- Confirm internal transfer fee structure
- Co-marketing asset approval (logos, messaging)
- Referral/affiliate link setup
- Launch coordination and announcement timing

### Partnership Pitch Outline
```
Subject: Partnership Opportunity - Zero-Fee Lightning Corridor for Nostr Marketplace

Hi {Partner Team},

Nostr for Nomads is building a decentralized marketplace for the Bitcoin/Nostr community 
with Lightning payments. We'd like to feature {Wallet} as a preferred payment method.

**Proposal:**
- Prominently display your wallet as "0% fee" option when both parties use {Wallet}
- Co-marketing: Feature in our UI, blog posts, social media
- Drive signups: Incentivize users to create {Wallet} accounts for fee savings

**Your Benefits:**
- New user acquisition from our marketplace traffic
- Increased internal transaction volume (sticky users)
- Brand visibility in growing Nostr ecosystem

**Our Ask:**
- Confirm internal transfer fee structure
- Approve co-marketing assets
- Optional: Affiliate/referral link setup

Interested in discussing? Happy to provide more details on our user base and traffic.

Best,
{Your Name}
Nostr for Nomads Team
```

---

## Phase 4: NIP-57 Zaps for Tipping (Priority: LOW, Optional)

### Objective
Enable social tipping ("zaps") for content creators using Nostr-native protocol. This is OPTIONAL and separate from marketplace payments.

### Use Cases
- Tip contributions/articles in Explore feed
- Tip user profiles directly
- Public zap feed for social proof
- Creator monetization without formal product listings

### Technical Requirements
- NIP-57 zap request/receipt event generation
- Lightning address resolution for zap recipients
- Public zap feed display (kind:9735 events)
- Zap button UI component with preset amounts (21, 100, 1000 sats)

### Defer Until
- Core marketplace payments proven (Phase 1-2 complete)
- User demand validated (feature requests for tipping)
- 1000+ monthly active users milestone reached

---

## Technical Decisions & Rationale

### ✅ Decision: NO Backend Lightning Infrastructure
**Rejected Options:**
- LNbits self-hosted ($100-500/month + DevOps complexity)
- BTCPay Server ($200-500/month + $5-10K liquidity)
- Galoy/LNDhub (requires Bitcoin Core + LND node)
- Custodial API services (Strike/Azteco - high fees, custody risk)

**Rationale:**
- High cost and complexity for MVP with unproven demand
- Custody liability and regulatory risk
- Users already have Lightning wallets - don't recreate the wheel
- Client-side approach covers 95%+ of users with $0 infrastructure cost

### ✅ Decision: NO Programmatic Wallet Creation
**Research Findings:**
- Primal: No API, manual signup only
- Alby: No public wallet creation API
- Strike: No programmatic account creation
- Wallet of Satoshi: Closed API
- Self-hosted only option: LNbits/BTCPay (rejected above)

**Rationale:**
- Regulatory compliance prevents custodial wallets from offering this
- Self-hosted infrastructure too expensive for MVP
- Partnership strategy achieves same goal (user acquisition) without custody
- Users prefer existing wallets they trust over new custodial accounts

### ✅ Decision: Multi-Method Support Required
**WebLN Alone Insufficient:**
- Only ~0.4% desktop users have WebLN extensions installed
- Zero mobile support (no browser extensions on iOS/Android)
- Would exclude 99.6% of potential users

**Solution:**
- Primary: Lightning links for mobile (60% coverage)
- Secondary: QR codes for cross-device (35% coverage)
- Power users: WebLN for instant payments (0.4% coverage)
- Fallback: Manual copy/paste (100% guaranteed)

### ✅ Decision: Custom Lightning Address Proxy
**Why This Matters:**
- Portability: Users can change wallets without updating public profiles
- Branding: nostr.co.in domain looks professional vs generic wallet domains
- No custody: Zero risk, zero cost, zero complexity
- Quick win: 2-3 hours implementation for significant UX improvement

---

## Implementation Checklist

### Phase 1: Lightning Address Proxy
- [ ] Create `/api/.well-known/lnurlp/[username]/route.ts`
- [ ] Configure Next.js rewrites for `.well-known` handling
- [ ] Add `forwardToLightningAddress` field to profile schema
- [ ] Build profile settings UI for Lightning address configuration
- [ ] Test with 3+ wallet providers (Primal, Alby, Strike)
- [ ] Deploy to staging environment
- [ ] User acceptance testing with real Lightning wallets

### Phase 2: Multi-Method Payment UI
- [ ] Build `GenericLightningService.ts` with LNURL-pay helpers
- [ ] Create `useLightningPayment.ts` hook with method detection
- [ ] Implement `PaymentMethodSelector.tsx` component
- [ ] Build `WebLNPayButton.tsx` for desktop users
- [ ] Create `LightningQRCode.tsx` with QR generation
- [ ] Develop `InvoiceDisplay.tsx` for manual copy/paste
- [ ] Integrate payment modal into Shop product detail pages
- [ ] Integrate payment modal into Work application pages
- [ ] Test on desktop with WebLN (Alby extension)
- [ ] Test on mobile with Lightning links (Zeus, Phoenix, WoS)
- [ ] Test QR code scanning cross-device
- [ ] Test manual copy/paste fallback
- [ ] Deploy to production

### Phase 3: Zero-Fee Partnerships
- [ ] Draft partnership pitch emails (Alby, Primal, Strike)
- [ ] Send outreach to partner teams
- [ ] Schedule intro calls with interested partners
- [ ] Finalize partnership terms and co-marketing details
- [ ] Implement zero-fee detection logic
- [ ] Design and build zero-fee badge UI components
- [ ] Create wallet recommendation banners
- [ ] Add filter/sort by zero-fee availability
- [ ] Prepare co-marketing assets (blog post, social media)
- [ ] Coordinate launch timing with partners
- [ ] Deploy zero-fee features to production
- [ ] Launch announcement and partner promotion

### Phase 4: NIP-57 Zaps (Future, Optional)
- [ ] Validate user demand for tipping feature
- [ ] Reach 1000+ MAU milestone
- [ ] Implement NIP-57 zap request generation
- [ ] Build zap button UI with preset amounts
- [ ] Create public zap feed display
- [ ] Integrate into Explore and Profile pages
- [ ] Test and deploy

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ 100% of users can configure custom Lightning address
- ✅ Custom addresses successfully forward to 5+ wallet providers
- ✅ Invoice generation works from custom addresses
- ✅ Payments complete successfully with forwarded addresses

### Phase 2 Success Criteria
- ✅ 95%+ device/wallet coverage (all methods combined)
- ✅ <3 clicks to initiate payment on desktop (WebLN)
- ✅ <5 seconds to generate invoice from Lightning address
- ✅ Payment completion rate >80% (users who initiate payment)

### Phase 3 Success Criteria
- ✅ 1-2 confirmed wallet partnerships secured
- ✅ Zero-fee badge displayed correctly in 100% of eligible scenarios
- ✅ 10%+ increase in transactions using partner wallets
- ✅ Measurable user acquisition from partner co-marketing

### Phase 4 Success Criteria (If Implemented)
- ✅ 100+ zaps sent in first week
- ✅ 50+ unique users sending zaps
- ✅ 20+ creators receiving zaps
- ✅ Average zap amount >100 sats

---

## Risk Assessment & Mitigation

### Risk 1: Low Payment Completion Rate
**Scenario:** Users initiate payment but don't complete (abandon in wallet app)  
**Probability:** Medium  
**Impact:** High (lost sales)  
**Mitigation:**
- Clear instructions and progress indicators at each step
- Multiple method options reduce friction
- Order expiration reminders (15-minute timer)
- Manual payment verification option for edge cases

### Risk 2: Invoice Generation Failure
**Scenario:** Seller's Lightning address is invalid/offline  
**Probability:** Medium  
**Impact:** High (blocks all sales for that seller)  
**Mitigation:**
- Validate Lightning addresses on profile save (test query to `.well-known`)
- Display Lightning address status indicator in seller dashboard
- Email alerts to sellers when address validation fails
- Fallback: Allow manual invoice generation and sharing

### Risk 3: Partnership Rejections
**Scenario:** Wallet providers decline partnership  
**Probability:** Medium  
**Impact:** Low (feature still works, just less promotion)  
**Mitigation:**
- Multiple partner targets (only need 1-2 to succeed)
- Zero-fee detection works without formal partnership
- Organic promotion still valuable even without co-marketing
- Self-hosted wallet option (Phase 4+) as ultimate fallback

### Risk 4: WebLN API Changes
**Scenario:** WebLN standard evolves, breaks compatibility  
**Probability:** Low  
**Impact:** Low (only affects 0.4% of users)  
**Mitigation:**
- Use latest `@webln/types` package
- Feature detection prevents crashes if API unavailable
- Automatic fallback to other methods
- Regular testing with Alby/Zeus extensions

### Risk 5: LNURL-pay Endpoint Downtime
**Scenario:** User's wallet provider `.well-known` endpoint is down  
**Probability:** Low  
**Impact:** Medium (that seller can't receive payments)  
**Mitigation:**
- Retry logic with exponential backoff (3 attempts)
- Clear error messaging to seller: "Your Lightning address is unreachable"
- Alternative: Manual invoice generation fallback
- Wallet provider redundancy via address rotation (advanced)

---

## Future Enhancements (Post-MVP)

### Lightning Escrow (Requires Backend)
Hold payments in escrow until delivery confirmation, protecting both parties. Requires hodl invoices (HTLC) and settlement logic.

### Automatic Payment Verification
Monitor blockchain/wallet APIs for payment confirmations instead of manual verification. Requires polling infrastructure or webhook integration.

### Multi-Currency Support
Accept payments in BTC, USD, EUR via Strike API. Seller receives preferred denomination.

### Subscription Payments
Recurring Lightning payments for subscription-based products/services. Requires LNURL-pay recurring extension support.

### Payment Analytics Dashboard
Track payment volume, success rates, popular methods, wallet distributions. Inform optimization and partnerships.

---

## Questions for Review

1. **Scope Approval:** Does Phase 1-2 scope match MVP requirements? Any features missing?

2. **Resource Allocation:** What development resources are available for Phase 1-2? Any blockers anticipated?

3. **Partnership Priority:** Should we pursue Phase 3 partnerships immediately or wait for Phase 2 completion and user traction?

4. **Domain Setup:** Do we own `nostr.co.in` domain? Any DNS/SSL certificate prep needed for `.well-known` endpoint?

5. **Profile Schema:** Does adding `forwardToLightningAddress` field require database migration? Any existing `lud16` field conflicts?

6. **Payment Verification:** Manual verification acceptable for MVP, or do we need automated payment monitoring from day 1?

7. **Fee Transparency:** Should we display estimated fees for each payment method in UI? (e.g., "WebLN: ~0.5% routing fee")

8. **Error Handling:** What's the seller experience if their Lightning address fails? Email notification? Dashboard alert? Both?

---

## Appendix: Code File Locations

### New Files to Create
- `/src/app/api/.well-known/lnurlp/[username]/route.ts` - Lightning address proxy endpoint
- `/src/services/generic/GenericLightningService.ts` - LNURL-pay protocol helpers
- `/src/hooks/useLightningPayment.ts` - Payment method detection and flow management
- `/src/components/payments/PaymentMethodSelector.tsx` - UI for method selection
- `/src/components/payments/WebLNPayButton.tsx` - One-click WebLN payments
- `/src/components/payments/LightningQRCode.tsx` - QR code generation and display
- `/src/components/payments/InvoiceDisplay.tsx` - Manual copy/paste fallback
- `/src/components/payments/PaymentModal.tsx` - Main payment modal container

### Files to Modify
- `/src/types/nostr.ts` - Add `forwardToLightningAddress?: string` to profile type
- `/src/app/shop/[id]/page.tsx` - Integrate payment modal on product detail page
- `/src/app/work/[id]/page.tsx` - Integrate payment modal on work detail page
- `/src/components/profile/ProfileSettings.tsx` - Add Lightning address configuration UI
- `/next.config.js` - Add rewrite rule for `.well-known` handling
- `/src/config/relays.ts` - Optional: Add payment event relay if doing NIP-57

### Reference Files (No Changes)
- `/src/stores/useAuthStore.ts` - Already has profile data with `lud16` field
- `/src/services/nostr/NostrEventService.ts` - May use for future NIP-57 implementation
- `/src/app/payments/page.tsx` - Current UI mockup (can deprecate or repurpose)

---

**End of Implementation Plan**
