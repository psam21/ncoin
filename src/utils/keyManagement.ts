
import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { nip19 } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

export function generateKeys(): {
  secretKey: Uint8Array;
  pubkey: string;
  nsec: string;
  npub: string;
} {
  try {
    // Generate cryptographically secure random secret key
    const secretKey = generateSecretKey();
    
    // Derive public key from secret key
    const pubkey = getPublicKey(secretKey);
    
    // Encode keys in bech32 format (NIP-19)
    const nsec = nip19.nsecEncode(secretKey);
    const npub = nip19.npubEncode(pubkey);
    
    // Validate key lengths (nsec and npub should both be 63 characters)
    if (nsec.length !== 63 || npub.length !== 63) {
      throw new Error('Invalid key encoding length');
    }
    
    // Verify roundtrip encoding/decoding works
    const decodedSecret = nip19.decode(nsec);
    if (decodedSecret.type !== 'nsec') {
      throw new Error('Failed to verify nsec encoding');
    }
    
    const decodedPubkey = nip19.decode(npub);
    if (decodedPubkey.type !== 'npub') {
      throw new Error('Failed to verify npub encoding');
    }
    
    return {
      secretKey,
      pubkey,
      nsec,
      npub,
    };
  } catch (error) {
    console.error('Key generation failed:', error);
    throw new Error('Failed to generate Nostr keys. Please try again.');
  }
}

export function decodeNsec(nsec: string): string {
  try {
    const decoded = nip19.decode(nsec);
    
    if (decoded.type !== 'nsec') {
      throw new Error('Invalid nsec format');
    }
    
    // Convert Uint8Array to hex string
    return bytesToHex(decoded.data);
  } catch (error) {
    console.error('Failed to decode nsec:', error);
    throw new Error('Invalid nsec format. Please check your secret key.');
  }
}

export function decodeNpub(npub: string): string {
  try {
    const decoded = nip19.decode(npub);
    
    if (decoded.type !== 'npub') {
      throw new Error('Invalid npub format');
    }
    
    return decoded.data;
  } catch (error) {
    console.error('Failed to decode npub:', error);
    throw new Error('Invalid npub format. Please check your public key.');
  }
}

export function isValidNsec(nsec: string): boolean {
  try {
    const decoded = nip19.decode(nsec);
    return decoded.type === 'nsec' && nsec.length === 63;
  } catch {
    return false;
  }
}

export function isValidNpub(npub: string): boolean {
  try {
    const decoded = nip19.decode(npub);
    return decoded.type === 'npub' && npub.length === 63;
  } catch {
    return false;
  }
}
