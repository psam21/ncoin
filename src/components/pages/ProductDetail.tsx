'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, Share2, Package, Bitcoin, DollarSign } from 'lucide-react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { logger } from '@/services/core/LoggingService';
import type { ProductEvent } from '@/types/shop';
import type { ContentMediaItem } from '@/types/content-media';
import type { InfoItem } from '@/components/generic/ContentDetailInfo';

interface ProductDetailProps {
  product: ProductEvent;
  backHref?: string;
}

export function ProductDetail({ product, backHref = '/shop' }: ProductDetailProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleContactSeller = () => {
    logger.info('Navigating to messages for seller', {
      service: 'ProductDetail',
      method: 'handleContactSeller',
      sellerPubkey: product.pubkey,
      productId: product.id,
    });

    // Navigate to messages with context
    const params = new URLSearchParams({
      recipient: product.pubkey,
      context: `product:${product.dTag}`,
      contextTitle: product.title,
      ...(product.media.images[0]?.url && { contextImage: product.media.images[0].url }),
    });

    router.push(`/messages?${params.toString()}`);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/shop/${encodeURIComponent(product.dTag)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.summary || product.description,
          url,
        });
        logger.info('Product shared via Web Share API', {
          service: 'ProductDetail',
          method: 'handleShare',
          productId: product.id,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          logger.error('Error sharing product', err as Error, {
            service: 'ProductDetail',
            method: 'handleShare',
          });
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        logger.info('Product link copied to clipboard', {
          service: 'ProductDetail',
          method: 'handleShare',
          productId: product.id,
        });
      } catch (err) {
        logger.error('Error copying to clipboard', err as Error, {
          service: 'ProductDetail',
          method: 'handleShare',
        });
      }
    }
  };

  // Convert product media to ContentMediaGallery format
  const mediaItems: ContentMediaItem[] = useMemo(() => {
    const items: ContentMediaItem[] = [];

    product.media.images.forEach((img, index) => {
      items.push({
        id: `image-${index}`,
        type: 'image',
        source: {
          url: img.url,
          mimeType: img.mimeType,
          hash: img.hash,
          size: img.size,
          dimensions: img.dimensions,
        },
      });
    });

    product.media.videos.forEach((vid, index) => {
      items.push({
        id: `video-${index}`,
        type: 'video',
        source: {
          url: vid.url,
          mimeType: vid.mimeType,
          hash: vid.hash,
          size: vid.size,
          dimensions: vid.dimensions,
        },
      });
    });

    return items;
  }, [product.media]);

  // Product metadata for info panel
  const productMetadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];

    items.push({
      label: 'Category',
      value: product.category,
      emphasis: true,
    });

    items.push({
      label: 'Condition',
      value: product.condition.charAt(0).toUpperCase() + product.condition.slice(1),
    });

    items.push({
      label: 'Location',
      value: product.location,
    });

    items.push({
      label: 'Contact',
      value: product.contact,
    });

    return items;
  }, [product.category, product.condition, product.location, product.contact]);

  // Price display
  const priceDisplay = useMemo(() => {
    if (product.currency === 'sats') {
      return `${product.price.toLocaleString()} sats`;
    } else if (product.currency === 'BTC') {
      return `₿${product.price}`;
    } else {
      return `$${product.price}`;
    }
  }, [product.price, product.currency]);

  const currencyIcon = useMemo(() => {
    if (product.currency === 'BTC' || product.currency === 'sats') {
      return <Bitcoin className="w-5 h-5" />;
    }
    return <DollarSign className="w-5 h-5" />;
  }, [product.currency]);

  // Filter out system tags
  const tags = useMemo(() => {
    return product.tags.filter(tag => tag.toLowerCase() !== 'nostr-for-nomads-shop');
  }, [product.tags]);

  return (
    <div className="space-y-10">
      <ContentDetailHeader
        title={product.title}
        actions={[]}
        backHref={backHref}
        backLabel="Back to shop"
        customButtons={
          <>
            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className={`btn-outline-sm inline-flex items-center justify-center ${
                isLiked ? '!border-red-300 !bg-red-50 !text-red-700 hover:!bg-red-100' : ''
              }`}
              aria-label={isLiked ? 'Unlike product' : 'Like product'}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            
            <button
              type="button"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`btn-outline-sm inline-flex items-center justify-center ${
                isBookmarked ? '!border-purple-300 !bg-purple-50 !text-purple-700 hover:!bg-purple-100' : ''
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark product'}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-purple-500 text-purple-500' : ''}`} />
            </button>
            
            <button
              type="button"
              onClick={handleShare}
              className="btn-outline-sm inline-flex items-center justify-center"
              aria-label="Share product"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </>
        }
      />

      <ContentDetailLayout
        media={
          <>
            {mediaItems.length > 0 ? (
              <ContentMediaGallery items={mediaItems} />
            ) : (
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="w-24 h-24 text-gray-300" />
              </div>
            )}
          </>
        }
        main={
          <section
            aria-labelledby="product-details"
            className="space-y-5 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-primary-100"
          >
            <h2
              id="product-details"
              className="text-sm font-semibold uppercase tracking-wide text-gray-500"
            >
              Product Details
            </h2>

            {/* Price prominently displayed */}
            <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-inner ring-1 ring-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price</p>
                  <p className="text-4xl font-bold text-purple-900">{priceDisplay}</p>
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  {currencyIcon}
                </div>
              </div>
            </div>

            {/* Product metadata grid */}
            {productMetadata.length > 0 && (
              <dl className="grid grid-cols-1 gap-4 rounded-2xl bg-white/70 p-4 shadow-inner ring-1 ring-primary-100 md:grid-cols-2">
                {productMetadata.map(item => (
                  <div key={item.label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      {item.label}
                    </dt>
                    <dd
                      className={`mt-1 text-base font-medium ${item.emphasis ? 'text-primary-900' : 'text-gray-700'}`}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        }
        sidebar={
          <div className="space-y-4">
            {/* Seller info section */}
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-primary-100">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Seller
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {product.pubkey.slice(0, 8)}...{product.pubkey.slice(-8)}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(product.pubkey)}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    Copy pubkey
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={handleContactSeller}
                className="btn-primary-sm w-full"
                aria-label="Contact seller via messages"
              >
                Contact Seller
              </button>
            </div>

            {/* Product meta info */}
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-primary-100">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Listing Info
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Published</dt>
                  <dd className="text-gray-900 font-medium">
                    {new Date(product.publishedAt * 1000).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Product ID</dt>
                  <dd className="text-gray-900 font-mono text-xs break-all">
                    {product.dTag}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        }
        footer={
          <ContentDetailInfo
            title="About this product"
            description={product.description}
            tags={tags}
          />
        }
      />
    </div>
  );
}
