'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProductForm } from '@/components/pages/ProductForm';
import { Store } from 'lucide-react';

export default function CreateProductPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  // Add detailed logging for debugging
  useEffect(() => {
    console.log('[MY-SHOP/CREATE] Component mounted/updated:', {
      _hasHydrated,
      hasUser: !!user,
      userPubkey: user?.pubkey?.substring(0, 16) || 'none',
      timestamp: new Date().toISOString(),
    });
  }, [_hasHydrated, user]);

  useEffect(() => {
    // Only check auth after hydration is complete
    if (_hasHydrated && !user) {
      console.log('[MY-SHOP/CREATE] Redirecting to signin - no user after hydration');
      router.push('/signin?returnUrl=' + encodeURIComponent('/my-shop/create'));
    } else if (_hasHydrated && user) {
      console.log('[MY-SHOP/CREATE] User authenticated after hydration:', {
        pubkey: user.pubkey.substring(0, 16),
        npub: user.npub.substring(0, 16),
      });
    }
  }, [_hasHydrated, user, router]);

  const handleProductCreated = (productId: string) => {
    console.log('Product created:', productId);
    // Redirect handled by ProductForm
  };

  const handleCancel = () => {
    router.push('/my-shop');
  };

  // Show loading state while hydrating
  if (!_hasHydrated) {
    console.log('[MY-SHOP/CREATE] Waiting for hydration...');
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // After hydration, if no user, return null (redirect will happen via useEffect)
  if (!user) {
    console.log('[MY-SHOP/CREATE] No user after hydration, returning null (redirect pending)');
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Main Content */}
      <div className="container-width py-8">
        <ProductForm
          onProductCreated={handleProductCreated}
          onCancel={handleCancel}
          isEditMode={false}
        />
      </div>
    </div>
  );
}
