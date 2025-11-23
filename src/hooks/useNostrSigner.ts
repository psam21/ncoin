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
    let pollInterval: NodeJS.Timeout | null = null;
    
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
      // For authenticated extension users, assume extension exists even if not loaded yet
      if (isAuthenticated && user && !nsec) {
        // Extension user (has no nsec, authenticated via extension)
        if (typeof window !== 'undefined' && window.nostr) {
          // Extension loaded - use it
          logger.info('Extension signer available for authenticated extension user', {
            service: 'useNostrSigner',
            method: 'initializeSigner',
            userPubkey: user.pubkey.substring(0, 8) + '...',
          });
          
          setSigner(window.nostr);
          setSignerAvailable(true);
          useAuthStore.getState().setLoading(false);
          
          // Initialize message cache proactively
          (async () => {
            try {
              const { messagingBusinessService } = await import('@/services/business/MessagingBusinessService');
              await messagingBusinessService.initializeCache(user.pubkey);
            } catch (error) {
              console.warn('Failed to proactively initialize message cache:', error instanceof Error ? error.message : 'Unknown error');
            }
          })();
        } else {
          // Extension not loaded yet - poll for it
          logger.warn('Extension user authenticated but window.nostr not available - polling for extension', {
            service: 'useNostrSigner',
            method: 'initializeSigner',
            userPubkey: user.pubkey.substring(0, 8) + '...',
          });
          
          let attempts = 0;
          const maxAttempts = 20; // Poll for 2 seconds (20 * 100ms)
          
          pollInterval = setInterval(() => {
            attempts++;
            
            if (typeof window !== 'undefined' && window.nostr) {
              // Extension loaded!
              logger.info('Extension loaded after polling', {
                service: 'useNostrSigner',
                method: 'initializeSigner',
                attempts,
                userPubkey: user.pubkey.substring(0, 8) + '...',
              });
              
              if (pollInterval) clearInterval(pollInterval);
              
              setSigner(window.nostr);
              setSignerAvailable(true);
              useAuthStore.getState().setLoading(false);
              
              // Initialize message cache
              (async () => {
                try {
                  const { messagingBusinessService } = await import('@/services/business/MessagingBusinessService');
                  await messagingBusinessService.initializeCache(user.pubkey);
                } catch (error) {
                  console.warn('Failed to initialize message cache:', error instanceof Error ? error.message : 'Unknown error');
                }
              })();
            } else if (attempts >= maxAttempts) {
              // Give up after max attempts
              logger.error('Extension failed to load after polling - logging out', new Error('Extension not available'), {
                service: 'useNostrSigner',
                method: 'initializeSigner',
                attempts,
                userPubkey: user.pubkey.substring(0, 8) + '...',
              });
              
              if (pollInterval) clearInterval(pollInterval);
              
              // Force logout - extension user with no extension
              useAuthStore.getState().logout();
            }
          }, 100); // Check every 100ms
          
          // Set loading state while polling
          setSigner(null);
          setSignerAvailable(false);
          useAuthStore.getState().setLoading(true);
        }
        return;
      }
      
      // For non-authenticated users: check if extension exists for sign-in
      if (typeof window !== 'undefined' && window.nostr && !isAuthenticated) {
        setSigner(null);
        setSignerAvailable(true);
        useAuthStore.getState().setLoading(false);
        logger.info('Browser extension detected - available for sign-in', {
          service: 'useNostrSigner',
          method: 'initializeSigner',
        });
        return;
      }

      // Priority 3: No signer available
      // This should ONLY be reached for authenticated users with NO nsec AND NO extension
      // which indicates a corrupted auth state
      if (isAuthenticated && user) {
        logger.error('CRITICAL: Authenticated user has no valid signer - forcing re-authentication', new Error('No valid signer for authenticated user'), {
          service: 'useNostrSigner',
          method: 'initializeSigner',
          userPubkey: user.pubkey.substring(0, 8) + '...',
          hasNsec: !!nsec,
          hasWindowNostr: !!(typeof window !== 'undefined' && window.nostr),
          reason: 'This indicates corrupted auth state - user is authenticated but has no way to sign events',
        });
        useAuthStore.getState().logout();
      } else {
        logger.info('No signer available for non-authenticated user (expected)', {
          service: 'useNostrSigner',
          method: 'initializeSigner',
        });
      }
      
      setSigner(null);
      setSignerAvailable(false);
      useAuthStore.getState().setLoading(false);
    };

    initializeSigner();
    
    // Cleanup: clear polling interval if component unmounts
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
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