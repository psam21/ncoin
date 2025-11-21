'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchProductById } from '@/services/business/ShopService';
import { ProductEvent } from '@/types/shop';
import { logger } from '@/services/core/LoggingService';
import { Store, Loader2, AlertCircle } from 'lucide-react';
import { ProductForm } from '@/components/pages/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [product, setProduct] = useState<ProductEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dTag = params.id as string;

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (!dTag) {
        setError('Product ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const productData = await fetchProductById(dTag);

        if (!productData) {
          setError('Product not found');
          return;
        }

        // Verify ownership
        if (productData.pubkey !== user?.pubkey) {
          setError('You can only edit your own products');
          return;
        }

        setProduct(productData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load product';
        logger.error('Error loading product for edit', err instanceof Error ? err : new Error(errorMsg), {
          service: 'EditProductPage',
          method: 'loadProduct',
          dTag,
        });
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [dTag, user?.pubkey]);

  const handleProductUpdated = (productId: string) => {
    console.log('Product updated:', productId);
    router.push('/my-shop');
  };

  const handleCancel = () => {
    router.push('/my-shop');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-16">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to edit products.
            </p>
            <Link href="/signin" className="btn-primary-sm">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-16">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container-width py-8">
            <div className="flex flex-col items-center justify-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6 text-center max-w-md">
              {error || 'Product not found'}
            </p>
              <button
                onClick={() => router.push('/my-shop')}
                className="btn-primary-sm"
              >
                Back to My Shop
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert ProductEvent to form default values
  // Convert media URLs to GenericAttachment format
  const attachments: import('@/types/attachments').GenericAttachment[] = [];
  
  // Add images
  product.media.images.forEach((media, index) => {
    attachments.push({
      id: `image-${index}`,
      type: 'image',
      name: `Image ${index + 1}`,
      size: media.size || 0,
      mimeType: media.mimeType || 'image/jpeg',
      url: media.url,
      hash: media.hash,
      createdAt: product.createdAt,
    });
  });

  // Add videos
  product.media.videos.forEach((media, index) => {
    attachments.push({
      id: `video-${index}`,
      type: 'video',
      name: `Video ${index + 1}`,
      size: media.size || 0,
      mimeType: media.mimeType || 'video/mp4',
      url: media.url,
      hash: media.hash,
      createdAt: product.createdAt,
    });
  });

  // Add audio
  product.media.audio.forEach((media, index) => {
    attachments.push({
      id: `audio-${index}`,
      type: 'audio',
      name: `Audio ${index + 1}`,
      size: media.size || 0,
      mimeType: media.mimeType || 'audio/mpeg',
      url: media.url,
      hash: media.hash,
      createdAt: product.createdAt,
    });
  });

  const defaultValues = {
    title: product.title,
    description: product.description,
    price: product.price.toString(),
    currency: product.currency as 'BTC' | 'sats' | 'USD',
    category: product.category,
    condition: product.condition as 'new' | 'used' | 'refurbished',
    location: product.location,
    contact: product.contact,
    tags: product.tags,
    attachments,
    dTag,
    productId: product.id,
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-900">Edit Product</h1>
              <p className="text-gray-600 text-lg mt-1">
                Update your product listing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        <ProductForm
          onProductCreated={handleProductUpdated}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          isEditMode={true}
        />
      </div>
    </div>
  );
}
