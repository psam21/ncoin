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

  useEffect(() => {
    // Only check auth after hydration is complete
    if (_hasHydrated && !user) {
      router.push('/signin?returnUrl=' + encodeURIComponent('/my-shop/create'));
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
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-900">List a Product</h1>
              <p className="text-gray-600 text-lg mt-1">
                Share products or services with the nomad community
              </p>
            </div>
          </div>
        </div>
      </div>

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
