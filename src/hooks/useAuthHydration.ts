import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/services/core/LoggingService';

export function useAuthHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  useEffect(() => {
    logger.info('useAuthHydration check', {
      service: 'useAuthHydration',
      _hasHydrated,
      hasUser: !!user,
      isAuthenticated,
      userPubkey: user?.pubkey?.substring(0, 8) + '...' || 'none',
    });
    
    if (_hasHydrated) {
      logger.info('Auth store hydrated, setting isHydrated to true', {
        service: 'useAuthHydration',
        hasUser: !!user,
        isAuthenticated,
      });
      setIsHydrated(true);
    }
  }, [_hasHydrated, user, isAuthenticated]);
  
  return isHydrated;
}
