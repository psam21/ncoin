'use client';

import { useEffect, useMemo } from 'react';
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
  const getSigner = async (): Promise<NostrSigner> => {
    const { isAuthenticated, user, nsec: nsecFromStore } = useAuthStore.getState();
    
    if (!isAuthenticated || !user) {
      throw new AppError(
        'User not authenticated',
        ErrorCode.SIGNER_NOT_DETECTED,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH
      );
    }
    
    // Priority 1: Nsec user (has nsec in store)
    if (nsecFromStore) {
      logger.info('Getting signer from nsec', {
        service: 'useNostrSigner',
        method: 'getSigner',
        userPubkey: user.pubkey.substring(0, 8) + '...',
      });
      
      if (nsecSigner) {
        return await nsecSigner;
      }
      
      return await createNsecSigner(nsecFromStore);
    }
    
    // Priority 2: Extension user (no nsec, must use window.nostr)
    if (typeof window !== 'undefined' && window.nostr) {
      logger.info('Getting signer from extension', {
        service: 'useNostrSigner',
        method: 'getSigner',
        userPubkey: user.pubkey.substring(0, 8) + '...',
      });
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
  };

  // Simple detection: Only check if extension exists for non-authenticated users (sign-in button)
  // For authenticated users, trust Zustand state and get signer lazily when needed
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
    
    // For authenticated users: trust Zustand, set available based on auth method
    if (isAuthenticated && user) {
      const hasNsec = !!nsec;
      const hasExtension = typeof window !== 'undefined' && !!window.nostr;
      
      // Available if they have nsec OR extension
      setSignerAvailable(hasNsec || hasExtension);
      useAuthStore.getState().setLoading(false);
      
      logger.info('Authenticated user - signer will be retrieved lazily when needed', {
        service: 'useNostrSigner',
        method: 'useEffect',
        hasNsec,
        hasExtension,
        userPubkey: user.pubkey.substring(0, 8) + '...',
      });
    }
  }, [nsec, setSignerAvailable]);

  return { 
    isAvailable, 
    isLoading, 
    error, 
    signer,
    getSigner,
  };
};