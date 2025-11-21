import React from 'react';
import Image from 'next/image';
import { Clock, MapPin } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';
import type { ProductCardData } from '@/types/shop';
import { getRelativeTime } from '@/utils/dateUtils';

interface MyProductCardProps {
  product: ProductCardData;
  onEdit: (product: ProductCardData) => void;
  onDelete: (product: ProductCardData) => void;
}

/**
 * My Product Card Component
 * Displays user's product in my-shop dashboard
 * 
 * SOA Layer: Presentation (UI only, no business logic)
 */
export const MyProductCard: React.FC<MyProductCardProps> = ({ 
  product, 
  onEdit, 
  onDelete
}) => {
  const getConditionColor = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition === 'new') {
      return 'bg-green-100 text-green-700';
    }
    if (lowerCondition === 'used') {
      return 'bg-blue-100 text-blue-700';
    }
    if (lowerCondition === 'refurbished') {
      return 'bg-purple-100 text-purple-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'art': 'bg-pink-100 text-pink-700',
      'services': 'bg-blue-100 text-blue-700',
      'hardware': 'bg-gray-100 text-gray-700',
      'software': 'bg-cyan-100 text-cyan-700',
      'education': 'bg-purple-100 text-purple-700',
      'fashion': 'bg-rose-100 text-rose-700',
      'food': 'bg-orange-100 text-orange-700',
      'home': 'bg-green-100 text-green-700',
      'sports': 'bg-indigo-100 text-indigo-700',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-700';
  };

  const getCurrencySymbol = (currency: string) => {
    if (currency === 'BTC') return '₿';
    if (currency === 'sats') return 'sats';
    if (currency === 'USD') return '$';
    return currency;
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = getCurrencySymbol(currency);
    if (currency === 'sats') {
      return `${price.toLocaleString()} ${symbol}`;
    }
    return `${symbol}${price.toLocaleString()}`;
  };

  const handleEdit = () => {
    logger.info('Edit product clicked', {
      component: 'MyProductCard',
      method: 'handleEdit',
      productId: product.id,
      title: product.title,
    });
    onEdit(product);
  };

  const handleDelete = () => {
    logger.info('Delete product clicked', {
      component: 'MyProductCard',
      method: 'handleDelete',
      productId: product.id,
      title: product.title,
    });
    onDelete(product);
  };

  const handleView = () => {
    logger.info('View product clicked', {
      component: 'MyProductCard',
      method: 'handleView',
      productId: product.id,
      dTag: product.dTag,
    });
  };

  return (
    <div className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Product Image */}
      <div className="relative aspect-[4/3] bg-purple-50">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              logger.warn('Product image failed to load', {
                component: 'MyProductCard',
                method: 'handleImageError',
                productId: product.id,
                imageUrl: product.imageUrl,
              });
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex items-center justify-center bg-purple-100">
                    <svg class="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                    </svg>
                  </div>
                `;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-purple-100">
            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
        )}
        
        {/* Price Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-white/95 backdrop-blur-sm text-purple-900 shadow-lg">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>

        {/* Created Time Badge - Top Right */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {getRelativeTime(product.createdAt)}
          </span>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-purple-800 mb-2 line-clamp-2">
          {product.title}
        </h3>
        
        <p className="text-base mb-4 line-clamp-3 leading-relaxed text-purple-600">
          {product.description}
        </p>
        
        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4" />
          <span>{product.location}</span>
        </div>

        {/* Condition and Category */}
        <div className="mb-4 flex gap-2">
          <span className={`px-3 py-1 rounded-full font-medium text-sm ${getCategoryColor(product.category)}`}>
            {product.category}
          </span>
          <span className={`px-3 py-1 rounded-full font-medium text-sm ${getConditionColor(product.condition)}`}>
            {product.condition}
          </span>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <a
            href={`/shop/${product.dTag}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleView}
            className="btn-outline-sm flex items-center justify-center px-3"
            title="View product"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </a>
          <button 
            onClick={handleEdit} 
            className="btn-primary-sm flex-1"
          >
            Edit
          </button>
          <button 
            onClick={handleDelete} 
            className="btn-danger-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
