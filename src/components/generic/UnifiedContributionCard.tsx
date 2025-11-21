import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clock, MapPin, Bookmark, MessageCircle, ImageIcon } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';
import { getRelativeTime } from '@/utils/dateUtils';

/**
 * Normalized contribution data for unified card
 * Bridges ContributionExploreItem and ContributionCardData
 */
export interface UnifiedContributionData {
  id: string;
  dTag: string;
  title: string;
  description: string;
  contributionType: string;
  category: string;
  location: string;
  region: string;
  country?: string;
  imageUrl?: string;
  tags: string[];
  pubkey: string;
  createdAt: number;
  // Explore-specific fields (optional)
  contributors?: number;
  mediaCount?: number;
  relativeTime?: string;
}

interface UnifiedContributionCardProps {
  contribution: UnifiedContributionData;
  variant: 'explore' | 'my-contributions';
  featured?: boolean;
  
  // Optional handlers for my-contributions variant
  onEdit?: (contribution: UnifiedContributionData) => void;
  onDelete?: (contribution: UnifiedContributionData) => void;
  
  // Optional handlers for explore variant
  onBookmark?: (contribution: UnifiedContributionData) => void;
}

/**
 * Unified Contribution Card Component
 * Displays contributions in both /explore and /my-contributions pages
 * 
 * SOA Layer: Presentation (UI only, no business logic)
 * 
 * Variants:
 * - explore: Shows bookmark, contact buttons, contributor stats
 * - my-contributions: Shows edit, delete, view buttons
 * 
 * Features:
 * - Responsive design (adapts to screen size)
 * - Featured variant for highlighted contributions
 * - Conditional action buttons based on variant
 * - Image fallback handling
 * - Hover effects and transitions
 */
export const UnifiedContributionCard: React.FC<UnifiedContributionCardProps> = ({ 
  contribution, 
  variant,
  featured = false,
  onEdit,
  onDelete,
  onBookmark
}) => {
  const router = useRouter();

  // Compute relative time if not provided
  const displayTime = contribution.relativeTime || getRelativeTime(contribution.createdAt);

  // Get contribution type color for my-contributions variant
  const getContributionTypeColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('experience')) return 'bg-purple-100 text-purple-700';
    if (lowerType.includes('tutorial') || lowerType.includes('guide')) return 'bg-blue-100 text-blue-700';
    if (lowerType.includes('review') || lowerType.includes('recommendation')) return 'bg-green-100 text-green-700';
    if (lowerType.includes('tip') || lowerType.includes('advice')) return 'bg-orange-100 text-orange-700';
    if (lowerType.includes('story') || lowerType.includes('journey')) return 'bg-pink-100 text-pink-700';
    if (lowerType.includes('resource') || lowerType.includes('tool')) return 'bg-cyan-100 text-cyan-700';
    return 'bg-gray-100 text-gray-700';
  };

  // Handlers
  const handleContactContributor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    logger.info('Contact contributor clicked', {
      component: 'UnifiedContributionCard',
      method: 'handleContactContributor',
      variant,
      contributionId: contribution.id,
      title: contribution.title,
    });

    const params = new URLSearchParams({
      recipient: contribution.pubkey,
      context: `contribution:${contribution.id}`,
      contextTitle: contribution.title,
      ...(contribution.imageUrl && { contextImage: contribution.imageUrl }),
    });

    router.push(`/messages?${params.toString()}`);
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    logger.info('Bookmark clicked', {
      component: 'UnifiedContributionCard',
      method: 'handleBookmark',
      variant,
      contributionId: contribution.id,
    });
    
    onBookmark?.(contribution);
  };

  const handleEdit = () => {
    logger.info('Edit contribution clicked', {
      component: 'UnifiedContributionCard',
      method: 'handleEdit',
      variant,
      contributionId: contribution.id,
      title: contribution.title,
    });
    onEdit?.(contribution);
  };

  const handleDelete = () => {
    logger.info('Delete contribution clicked', {
      component: 'UnifiedContributionCard',
      method: 'handleDelete',
      variant,
      contributionId: contribution.id,
      title: contribution.title,
    });
    onDelete?.(contribution);
  };

  const handleView = () => {
    logger.info('View contribution clicked', {
      component: 'UnifiedContributionCard',
      method: 'handleView',
      variant,
      contributionId: contribution.id,
      dTag: contribution.dTag,
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    logger.warn('Contribution image failed to load', {
      component: 'UnifiedContributionCard',
      method: 'handleImageError',
      variant,
      contributionId: contribution.id,
      imageUrl: contribution.imageUrl,
    });
    
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-purple-100">
          <svg class="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      `;
    }
  };

  // Featured card variant (explore only)
  if (featured && variant === 'explore') {
    return (
      <Link href={`/explore/${contribution.dTag}`}>
        <div className="culture-card group p-0 overflow-hidden cursor-pointer">
          {/* Featured Contribution Image */}
          <div className="relative aspect-video">
            {contribution.imageUrl ? (
              <Image
                src={contribution.imageUrl}
                alt={`Cultural scene representing ${contribution.title}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-100">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </div>
            
            {/* Bookmark Icon */}
            <div className="absolute top-4 left-4">
              <button
                onClick={handleBookmarkClick}
                className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                aria-label="Bookmark contribution"
              >
                <Bookmark className="w-4 h-4 text-purple-600" />
              </button>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 rounded-lg p-4 text-white">
                <h3 className="text-xl font-serif font-bold mb-2">
                  {contribution.title}
                </h3>
                <p className="text-sm opacity-90 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {contribution.location} · {contribution.region}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-gray-700 mb-4 line-clamp-3">{contribution.description}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="flex items-center justify-center mb-1">
                  <span className="font-semibold text-purple-800">
                    {contribution.contributors || 1}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Contributor</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <ImageIcon className="w-4 h-4 text-purple-600 mr-1" />
                  <span className="font-semibold text-purple-800">
                    {contribution.mediaCount || 0}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Media</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <span className="font-semibold text-purple-800">
                    {contribution.category}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Category</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {contribution.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-accent-50 text-accent-700 text-xs rounded-full font-medium px-2 py-1"
                >
                  #{tag}
                </span>
              ))}
              {contribution.tags.length > 3 && (
                <span className="text-gray-500 text-xs">
                  +{contribution.tags.length - 3} more
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{displayTime}</span>
              <button
                onClick={handleContactContributor}
                className="btn-outline-sm flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Contributor
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Regular card for explore variant
  if (variant === 'explore') {
    return (
      <Link href={`/explore/${contribution.dTag}`}>
        <div className="culture-card group cursor-pointer overflow-hidden">
          {/* Contribution Image */}
          <div className="relative aspect-video">
            {contribution.imageUrl ? (
              <Image
                src={contribution.imageUrl}
                alt={`Cultural scene representing ${contribution.title}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-100">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Bookmark Icon */}
            <div className="absolute top-3 right-3">
              <button
                onClick={handleBookmarkClick}
                className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                aria-label="Bookmark contribution"
              >
                <Bookmark className="w-4 h-4 text-purple-600" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-xl font-serif font-bold text-purple-800 mb-2 line-clamp-2">
              {contribution.title}
            </h3>
            
            <p className="text-gray-600 mb-4 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {contribution.location}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-3">
                <span className="flex items-center">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  {contribution.mediaCount || 0}
                </span>
                <span className="bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium text-sm">
                  {contribution.category}
                </span>
              </div>
              <span>{displayTime}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {contribution.tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="bg-accent-50 text-accent-700 text-xs rounded-full font-medium px-2 py-1"
                >
                  #{tag}
                </span>
              ))}
              {contribution.tags.length > 2 && (
                <span className="text-gray-500 text-xs">
                  +{contribution.tags.length - 2}
                </span>
              )}
            </div>
            
            <button
              onClick={handleContactContributor}
              className="w-full btn-outline-sm flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Contributor
            </button>
          </div>
        </div>
      </Link>
    );
  }

  // My-contributions variant
  return (
    <div className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Contribution Image */}
      <div className="relative aspect-[4/3] bg-purple-50">
        {contribution.imageUrl ? (
          <Image
            src={contribution.imageUrl}
            alt={contribution.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-purple-100">
            <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Contribution Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContributionTypeColor(contribution.contributionType)}`}>
            {contribution.contributionType}
          </span>
        </div>

        {/* Created Time Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {displayTime}
          </span>
        </div>
      </div>
      
      {/* Contribution Info */}
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-purple-800 mb-2 line-clamp-2">
          {contribution.title}
        </h3>
        
        <p className="text-base mb-4 line-clamp-3 leading-relaxed text-purple-600">
          {contribution.description}
        </p>
        
        {/* Location and Region */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4" />
          <span>
            {contribution.location || contribution.region}
            {contribution.country && `, ${contribution.country}`}
          </span>
        </div>

        {/* Category */}
        <div className="mb-4">
          <span className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium text-sm">
            {contribution.category}
          </span>
        </div>
        
        {/* Action Buttons - My Contributions */}
        <div className="flex gap-2">
          <a
            href={`/explore/${contribution.dTag}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleView}
            className="btn-outline-sm flex items-center justify-center px-3"
            title="View contribution"
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
