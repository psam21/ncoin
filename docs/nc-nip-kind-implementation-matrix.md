# NIP/Kind Implementation Matrix

Reference document for Nostr protocol implementation across Nostr for Nomads (ncoin) pages and features.

## Implementation Matrix

| Feature | NIP-01 | NIP-05 | NIP-07 | NIP-09 | NIP-17 | NIP-19 | NIP-23 | NIP-33 | NIP-44 | NIP-52 | NIP-78 | NIP-94 | NIP-96 | Kind 0 | Kind 1 | Kind 5 | Kind 14 | Kind 1059 | Kind 24242 | Kind 30023 | Kind 30078 | Kind 31923 | Kind 31925 | Status |
|---------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|--------|---------|-----------|------------|------------|------------|------------|------------|--------|
| Sign Up | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Production |
| Sign In | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Production |
| Profile | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | Production |
| Messages | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | Production |
| Payments | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | UI Only |
| My Shop | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | Production |
| Shop | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Production |
| My Work | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | Production |
| Work | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Production |
| Meet | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | Production |
| My Meet | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | Production |
| Explore | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | Production |
| My Contributions | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | Production |
| User Event Log | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Production |
| Cart (Planned) | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | Planned |

## Quick Reference

### NIPs Implemented

- **NIP-01**: Basic protocol (events, signing, relay communication)
- **NIP-05**: DNS-based verification
- **NIP-07**: Browser extension signer (Alby, nos2x, Nostore)
- **NIP-09**: Event deletion
- **NIP-17**: Private DMs (gift-wrapped)
- **NIP-19**: Bech32 entities (npub, nsec)
- **NIP-23**: Long-form content
- **NIP-33**: Parameterized replaceable events
- **NIP-44**: Encrypted payloads v2
- **NIP-52**: Calendar events
- **NIP-78**: Application-specific data
- **NIP-94**: File metadata (imeta tags)
- **NIP-96/Blossom**: Decentralized media hosting

### Event Kinds Used

- **Kind 0**: User metadata
- **Kind 1**: Short text notes
- **Kind 5**: Event deletion
- **Kind 14**: Rumor (NIP-17)
- **Kind 1059**: Gift wrap (NIP-17)
- **Kind 24242**: Blossom authorization
- **Kind 30023**: Long-form content (Shop, Work, Contributions)
- **Kind 30078**: App-specific data (Cart)
- **Kind 31923**: Calendar event (Meetups)
- **Kind 31925**: Calendar RSVP

---

**Last Updated**: November 23, 2025  
**Total**: 13 NIPs implemented, 10 event kinds in use, 14 features in production
