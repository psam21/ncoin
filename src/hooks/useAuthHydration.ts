import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';

export function useAuthHydration() {
  const [isHydrated, setIsHydrated] = useState(false);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  
  useEffect(() => {
    if (_hasHydrated) {
      setIsHydrated(true);
    }
  }, [_hasHydrated]);
  
  return isHydrated;
}
