'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { NostrSigner } from '@/types/nostr';
import { useAuthStore } from '@/stores/useAuthStore';
import { createNsecSigner } from '@/utils/signerFactory';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

// Extend Window interface to include nostr
declare global {
  interface Window {
    nostr?: NostrSigner;
  }
}

export const useNostrSigner = () => {
  const {
    isAvailable,
    isLoading,
    error,
    signer,
    nsec,
    setSignerAvailable,
    setSigner,
  } = useAuthStore();

  // Memoize nsec signer creation to avoid recreating on every render
  // Only recreates when nsec changes (sign-in, sign-up, or logout)
  const nsecSigner = useMemo(() => {
    if (!nsec) return null;
    
    logger.info('Creating memoized signer from nsec', {
      service: 'useNostrSigner',
      method: 'useMemo',
    });

    // Return promise that will be resolved in useEffect
    return createNsecSigner(nsec);
  }, [nsec]);

  // Helper to get signer when needed (LAZY - only called when signing events)
  // Caches result in store for reuse
  // Memoized with useCallback to prevent recreating on every render
  const getSigner = useCallback(async (): Promise<NostrSigner> => {
    const { isAuthenticated, user, nsec: nsecFromStore, signer: cachedSigner } = useAuthStore.getState();
    
    if (!isAuthenticated || !user) {
      throw new AppError(
        'User not authenticated',
        ErrorCode.SIGNER_NOT_DETECTED,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH
      );
    }
    
    // Return cached signer if available
    if (cachedSigner) {
      return cachedSigner;
    }
    
    // Priority 1: Nsec user (has nsec in store)
    if (nsecFromStore) {
      logger.info('Getting signer from nsec', {
        service: 'useNostrSigner',
        method: 'getSigner',
        userPubkey: user.pubkey.substring(0, 8) + '...',
      });
      
      let resolvedSigner: NostrSigner;
      if (nsecSigner) {
        resolvedSigner = await nsecSigner;
      } else {
        resolvedSigner = await createNsecSigner(nsecFromStore);
      }
      
      // Cache in store
      setSigner(resolvedSigner);
      return resolvedSigner;
    }
    
    // Priority 2: Extension user (no nsec, must use window.nostr)
    if (typeof window !== 'undefined' && window.nostr) {
      logger.info('Getting signer from extension', {
        service: 'useNostrSigner',
        method: 'getSigner',
        userPubkey: user.pubkey.substring(0, 8) + '...',
      });
      
      // Cache in store
      setSigner(window.nostr);
      return window.nostr;
    }
    
    // No signer available - this is an error state
    throw new AppError(
      'No signer available - extension not found',
      ErrorCode.SIGNER_NOT_DETECTED,
      HttpStatus.UNAUTHORIZED,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH
    );
  }, [nsec, nsecSigner, setSigner]); // Memoize with dependencies

  // Simple detection: Only check if extension exists for non-authenticated users (sign-in button)
  // For authenticated users, get signer once and cache it
  useEffect(() => {
    const { isAuthenticated, user } = useAuthStore.getState();
    
    // For non-authenticated users: detect if extension is available for sign-in
    if (!isAuthenticated) {
      const hasExtension = typeof window !== 'undefined' && !!window.nostr;
      setSignerAvailable(hasExtension);
      useAuthStore.getState().setLoading(false);
      
      if (hasExtension) {
        logger.info('Extension detected - available for sign-in', {
          service: 'useNostrSigner',
          method: 'useEffect',
        });
      }
      return;
    }
    
    // For authenticated users: get and cache signer once
    if (isAuthenticated && user) {
      const hasNsec = !!nsec;
      const hasExtension = typeof window !== 'undefined' && !!window.nostr;
      
      // Available if they have nsec OR extension
      setSignerAvailable(hasNsec || hasExtension);
      
      // Get signer once to cache it (for decryption hooks that need it immediately)
      getSigner().then(() => {
        logger.info('Signer cached for authenticated user', {
          service: 'useNostrSigner',
          method: 'useEffect',
          userPubkey: user.pubkey.substring(0, 8) + '...',
        });
        useAuthStore.getState().setLoading(false);
      }).catch((error) => {
        logger.error('Failed to get signer for authenticated user', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'useNostrSigner',
          method: 'useEffect',
          userPubkey: user.pubkey.substring(0, 8) + '...',
        });
        useAuthStore.getState().setLoading(false);
      });
    }
  }, [nsec, setSignerAvailable, getSigner]); // getSigner is now stable with useCallback

  return { 
    isAvailable, 
    isLoading, 
    error, 
    signer,
    getSigner,
  };
};