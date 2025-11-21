/**
 * Zustand store for authentication state management
 * Centralized state for Nostr signer and user authentication
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { NostrSigner } from '@/types/nostr';
import { UserProfile } from '@/services/business/ProfileBusinessService';

export interface AuthState {
  // Signer state
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  signer: NostrSigner | null;
  
  // User state
  user: {
    pubkey: string;
    npub: string;
    profile: UserProfile;
  } | null;
  isAuthenticated: boolean;
  
  // Private key (sign-up only, in-memory, never persisted)
  nsec: string | null;
  
  // Hydration state - tracks when zustand has finished loading from localStorage
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
  
  // Logout flag - prevents auto sign-in after explicit logout
  _hasLoggedOut: boolean;
  
  // Actions
  setSignerAvailable: (available: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSigner: (signer: NostrSigner | null) => void;
  setUser: (user: { pubkey: string; npub: string; profile: UserProfile } | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setNsec: (nsec: string | null) => void;
  logout: () => void;
  
  // Utility actions
  reset: () => void;
  getAuthStatus: () => {
    isAvailable: boolean;
    isLoading: boolean;
    isAuthenticated: boolean;
    hasError: boolean;
  };
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
      // Initial state - start with loading true so we don't flash "sign in required"
      isAvailable: false,
      isLoading: true, // Start as true, will be set to false after signer initialization
      error: null,
      signer: null,
      
      user: null,
      isAuthenticated: false,
      nsec: null,
      
      // Hydration state
      _hasHydrated: false,
      _hasLoggedOut: false,
      
      // Actions
      setHasHydrated: (hasHydrated) => set({ _hasHydrated: hasHydrated }),
      
      setSignerAvailable: (available) => set({ isAvailable: available }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setSigner: (signer) => set({ signer }),
      
      setUser: (user) => set({ 
        user,
        isAuthenticated: !!user,
        _hasLoggedOut: false, // Clear logout flag on successful sign-in
      }, false, 'setUser'),
      
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      
      setNsec: (nsec) => set({ nsec }),
      
      logout: () => {
        console.log('[AUTH STORE] Logout called from:', new Error().stack);
        
        // Cart service removed for messages-only app
        
        // Clear message cache (async, non-blocking)
        (async () => {
          try {
            // Import service and clear cache
            const messagingModule = await import('@/services/business/MessagingBusinessService');
            const { messagingBusinessService } = messagingModule;
            if (messagingBusinessService) {
              await messagingBusinessService.clearCache();
            }
          } catch (error) {
            // Log but don't throw - logout should proceed regardless of cache cleanup
            console.warn('Failed to clear message cache on logout:', error instanceof Error ? error.message : 'Unknown error');
          }
        })();
        
        // Clear authentication state and set logout flag
        set({
          user: null,
          isAuthenticated: false,
          signer: null,
          nsec: null,
          error: null,
          _hasLoggedOut: true, // Prevent auto sign-in after logout
        });
        
        // Clear ONLY Nostr for Nomads browser storage (not other sites)
        if (typeof window !== 'undefined') {
          // Clear localStorage - only our keys
          // (localStorage is already origin-isolated, but we'll be explicit)
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.startsWith('auth-store') || 
            key.startsWith('product-store') || 
            key.startsWith('my-shop-store') ||
            key.startsWith('shop-store') ||
            key.startsWith('cart-store') ||
            key === 'lastPublishedEvent' ||
            key.startsWith('nostr') ||
            key.startsWith('nostr-for-nomads')
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Clear sessionStorage - only our keys
          const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
            key.startsWith('auth-store') || 
            key.startsWith('product-store') || 
            key.startsWith('my-shop-store') ||
            key.startsWith('shop-store') ||
            key.startsWith('cart-store') ||
            key.startsWith('nostr') ||
            key.startsWith('nostr-for-nomads')
          );
          sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
          
          // Clear cookies - only for this domain (cookies are already domain-isolated)
          // This only affects culturebridge.vercel.app cookies
          document.cookie.split(';').forEach((cookie) => {
            const name = cookie.split('=')[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          });
          
          // Clear ALL IndexedDB databases on logout (nuclear option for security)
          if (window.indexedDB) {
            indexedDB.databases().then((databases) => {
              databases.forEach((db) => {
                if (db.name) {
                  indexedDB.deleteDatabase(db.name);
                }
              });
            }).catch((error) => {
              console.warn('Failed to clear IndexedDB:', error);
            });
          }
          
          // Clear Cache API - only Nostr for Nomads caches
          // (Caches are already origin-isolated, so this only affects our domain)
          if ('caches' in window) {
            caches.keys().then((names) => {
              // Cache names are scoped to this origin by the browser
              // so we're only seeing culturebridge.vercel.app caches
              names.forEach((name) => {
                caches.delete(name);
              });
            }).catch((error) => {
              console.warn('Failed to clear caches:', error);
            });
          }
        }
      },
      
      // Utility actions
      reset: () => set({
        isAvailable: false,
        isLoading: true,
        error: null,
        signer: null,
        user: null,
        isAuthenticated: false,
        nsec: null
      }),
      
      getAuthStatus: () => {
        const state = get();
        return {
          isAvailable: state.isAvailable,
          isLoading: state.isLoading,
          isAuthenticated: state.isAuthenticated,
          hasError: !!state.error
        };
      }
      }),
      {
        name: 'auth-store',
        partialize: (state: AuthState) => ({
          // Persist user data, authentication state, and nsec
          // nsec is persisted to allow seamless app usage without browser extension
          // User can sign events using their persisted nsec throughout their journey
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          isAvailable: state.isAvailable,
          nsec: state.nsec, // Persist nsec for signing events
          _hasLoggedOut: state._hasLoggedOut, // Persist logout flag to prevent auto sign-in
        }),
        onRehydrateStorage: () => (state) => {
          // Called when rehydration is complete
          if (state) {
            console.log('[AUTH STORE] Rehydration complete:', {
              hasUser: !!state.user,
              isAuthenticated: state.isAuthenticated,
              userPubkey: state.user?.pubkey?.substring(0, 8) + '...' || 'none',
              _hasLoggedOut: state._hasLoggedOut,
            });
            state.setHasHydrated(true);
          } else {
            console.warn('[AUTH STORE] Rehydration returned null state');
          }
        },
      }
    ),
    {
      name: 'auth-store-devtools'
    }
  )
);
