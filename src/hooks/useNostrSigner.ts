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

  // Helper to get signer when needed
  const getSigner = async (): Promise<NostrSigner> => {
    // CRITICAL: Only use authenticated user's signer, never mix with browser extension
    const { isAuthenticated, user, nsec: nsecFromStore } = useAuthStore.getState();
    
    // First priority: Check for nsec (persisted from sign-up)
    if (nsecFromStore && isAuthenticated && user) {
      logger.info('Getting signer from authenticated user nsec', {
        service: 'useNostrSigner',
        method: 'getSigner',
        hasNsec: true,
        userPubkey: user.pubkey.substring(0, 8) + '...',
      });
      
      // Use memoized signer if available, otherwise create new one
      if (nsecSigner) {
        return await nsecSigner;
      }
      
      return await createNsecSigner(nsecFromStore);
    }
    
    // Second priority: Check for cached signer (only if user is authenticated)
    if (signer && isAuthenticated && user) {
      logger.info('Getting cached Nostr signer instance for authenticated user', {
        service: 'useNostrSigner',
        method: 'getSigner',
        userPubkey: user.pubkey.substring(0, 8) + '...',
      });
      return signer;
    }
    
    // NEVER fall back to browser extension for authenticated users
    // This prevents privacy breaches where extension user != authenticated user
    if (isAuthenticated) {
      throw new AppError(
        'Authenticated user has no valid signer - sign in required',
        ErrorCode.SIGNER_NOT_DETECTED,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH
      );
    }
    
    // Only use browser extension for non-authenticated users (sign-in flow)
    if (typeof window !== 'undefined' && window.nostr && !isAuthenticated) {
      logger.info('Getting Nostr signer from browser extension for sign-in', {
        service: 'useNostrSigner',
        method: 'getSigner',
      });
      return window.nostr;
    }
    
    throw new AppError(
      'No signer available',
      ErrorCode.SIGNER_NOT_DETECTED,
      HttpStatus.UNAUTHORIZED,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.MEDIUM
    );
  };

  // Unified signer management: Strict user isolation - no extension fallback for authenticated users
  // Priority: Authenticated user's nsec > Browser Extension (sign-in only) > None
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initializeSigner = async () => {
      const { isAuthenticated, user } = useAuthStore.getState();
      
      logger.info('Initializing signer', {
        service: 'useNostrSigner',
        method: 'initializeSigner',
        hasExtension: !!(typeof window !== 'undefined' && window.nostr),
        hasNsec: !!nsec,
        isAuthenticated,
        hasUser: !!user,
      });

      // Set loading state
      useAuthStore.getState().setLoading(true);

      // Priority 1: Nsec (authenticated user - maintain consistent identity)
      if (nsec && nsecSigner && isAuthenticated && user) {
        try {
          logger.info('Using authenticated user nsec signer', {
            service: 'useNostrSigner',
            method: 'initializeSigner',
            userPubkey: user.pubkey.substring(0, 8) + '...',
          });

          const resolvedSigner = await nsecSigner;
          
          setSigner(resolvedSigner);
          setSignerAvailable(true);
          useAuthStore.getState().setLoading(false);
          
          // Initialize message cache proactively to avoid lazy initialization delay
          (async () => {
            try {
              const { messagingBusinessService } = await import('@/services/business/MessagingBusinessService');
              await messagingBusinessService.initializeCache(user.pubkey);
            } catch (error) {
              // Non-blocking - cache will be initialized lazily if this fails
              console.warn('Failed to proactively initialize message cache:', error instanceof Error ? error.message : 'Unknown error');
            }
          })();
          
          logger.info('Signer initialized for authenticated user with NIP-44 support', {
            service: 'useNostrSigner',
            method: 'initializeSigner',
            userPubkey: user.pubkey.substring(0, 8) + '...',
          });
        } catch (error) {
          logger.error('Failed to initialize signer for authenticated user', 
            error instanceof Error ? error : new Error('Unknown error'), {
            service: 'useNostrSigner',
            method: 'initializeSigner',
            userPubkey: user?.pubkey.substring(0, 8) + '...',
          });
          setSigner(null);
          setSignerAvailable(false);
          useAuthStore.getState().setLoading(false);
        }
        return;
      }

      // Priority 2: Browser extension (for authenticated extension-only sessions or non-auth sign-in)
      if (typeof window !== 'undefined' && window.nostr) {
        try {
          // For authenticated users: just use the extension without verification
          // We already verified the pubkey during sign-in, no need to prompt again
          if (isAuthenticated && user) {
            setSigner(window.nostr);
            setSignerAvailable(true);
            useAuthStore.getState().setLoading(false);
            
            // Initialize message cache proactively to avoid lazy initialization delay
            (async () => {
              try {
                const { messagingBusinessService } = await import('@/services/business/MessagingBusinessService');
                await messagingBusinessService.initializeCache(user.pubkey);
              } catch (error) {
                // Non-blocking - cache will be initialized lazily if this fails
                console.warn('Failed to proactively initialize message cache:', error instanceof Error ? error.message : 'Unknown error');
              }
            })();
            
            logger.info('Using extension signer for authenticated user (extension-only session)', {
              service: 'useNostrSigner',
              method: 'initializeSigner',
              userPubkey: user.pubkey.substring(0, 8) + '...',
            });
            return;
          }

          // For non-authenticated users: detect extension availability but DON'T set signer
          // This prevents premature permission prompts on page load
          // The signer will be set when user actually clicks "Sign In"
          setSigner(null);
          setSignerAvailable(true);
          useAuthStore.getState().setLoading(false);
          logger.info('Browser extension detected - available for sign-in', {
            service: 'useNostrSigner',
            method: 'initializeSigner',
          });
          return;
        } catch (error) {
          logger.error('Failed to verify extension signer', error instanceof Error ? error : new Error('Unknown error'), {
            service: 'useNostrSigner',
            method: 'initializeSigner',
          });
          // Fall through to no signer state
        }
      }

      // Priority 3: No signer available
      if (isAuthenticated && user) {
        logger.error('Authenticated user has no valid signer - forcing re-authentication', new Error('No valid signer for authenticated user'), {
          service: 'useNostrSigner',
          method: 'initializeSigner',
          userPubkey: user.pubkey.substring(0, 8) + '...',
        });
        useAuthStore.getState().logout();
      } else {
        logger.info('No signer available for non-authenticated user', {
          service: 'useNostrSigner',
          method: 'initializeSigner',
        });
      }
      
      setSigner(null);
      setSignerAvailable(false);
      useAuthStore.getState().setLoading(false);
    };

    initializeSigner();
    
    // No need for polling - signer initialization happens once on mount
    // and re-runs only when nsec or nsecSigner changes (due to sign-in/sign-up/logout)
    
    // Cleanup (nothing to clean up now)
    return () => {};
    // Note: `signer` intentionally excluded from deps to prevent infinite loop
    // We only want to re-initialize when `nsec` or `nsecSigner` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nsec, nsecSigner, setSigner, setSignerAvailable]);

  return { 
    isAvailable, 
    isLoading, 
    error, 
    signer,
    getSigner,
  };
};