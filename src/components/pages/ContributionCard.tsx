import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Bookmark, MessageCircle, ImageIcon } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';
import type { ContributionExploreItem } from '@/services/business/ContributionService';

interface ContributionCardProps {
  contribution: ContributionExploreItem;
  featured?: boolean;
}

export const ContributionCard: React.FC<ContributionCardProps> = ({ 
  contribution, 
  featured = false 
}) => {
  const router = useRouter();

  const handleContactContributor = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    logger.info('Contact contributor clicked', {
      service: 'ContributionCard',
      method: 'handleContactContributor',
      contributionId: contribution.id,
      title: contribution.name,
    });

    // Navigate to messages with context
    const params = new URLSearchParams({
      recipient: contribution.pubkey,
      context: `contribution:${contribution.id}`,
      contextTitle: contribution.name || 'Nomad Contribution',
      ...(contribution.image && { contextImage: contribution.image }),
    });

    router.push(`/messages?${params.toString()}`);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    logger.info('Bookmark clicked', {
      service: 'ContributionCard',
      method: 'handleBookmark',
      contributionId: contribution.id,
    });
    
    // TODO: Implement bookmark functionality
  };

  // Removed unused getContributionTypeColor function
  // Color logic can be added back if needed for badges

  if (featured) {
    return (
      <Link href={`/explore/${contribution.dTag}`}>
        <div className="culture-card group p-0 overflow-hidden cursor-pointer">
          {/* Featured Contribution Image */}
          <div className="relative aspect-video">
            <Image
              src={contribution.image}
              alt={`Cultural scene representing ${contribution.name}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => {
                logger.warn('Contribution image failed to load', {
                  service: 'ContributionCard',
                  contributionId: contribution.id,
                  imageUrl: contribution.image,
                });
              }}
            />
            
            <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </div>
            
            {/* Bookmark Icon */}
            <div className="absolute top-4 left-4">
              <button
                onClick={handleBookmark}
                className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                aria-label="Bookmark contribution"
              >
                <Bookmark className="w-4 h-4 text-purple-600" />
              </button>
            </div>
            
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90 flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {contribution.location} · {contribution.region}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-xl font-serif font-bold text-purple-800 mb-2 line-clamp-2">
              {contribution.name}
            </h3>
            
            <p className="text-gray-700 mb-4 line-clamp-3">{contribution.description}</p>
            
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="flex items-center justify-center mb-1">
                  <span className="font-semibold text-purple-800">
                    {contribution.contributors}
                  </span>
                </div>
                <p className="text-xs text-gray-600">Contributor</p>
              </div>
              <div>
                <div className="flex items-center justify-center mb-1">
                  <ImageIcon className="w-4 h-4 text-purple-600 mr-1" />
                  <span className="font-semibold text-purple-800">
                    {contribution.mediaCount}
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
                  className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs"
                >
                  {tag}
                </span>
              ))}
              {contribution.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                  +{contribution.tags.length - 3} more
                </span>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{contribution.relativeTime}</span>
              <button
                onClick={handleContactContributor}
                className="btn-outline-sm flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Contact
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Regular card (non-featured)
  return (
    <Link href={`/explore/${contribution.dTag}`}>
      <div className="culture-card group cursor-pointer overflow-hidden">
        {/* Contribution Image */}
        <div className="relative aspect-video">
          <Image
            src={contribution.image}
            alt={`Cultural scene representing ${contribution.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width:1200px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => {
              logger.warn('Contribution image failed to load', {
                service: 'ContributionCard',
                contributionId: contribution.id,
                imageUrl: contribution.image,
              });
            }}
          />
          
          {/* Bookmark Icon */}
          <div className="absolute top-3 right-3">
            <button
              onClick={handleBookmark}
              className="p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
              aria-label="Bookmark contribution"
            >
              <Bookmark className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-serif font-bold text-purple-800 mb-2 line-clamp-2">
            {contribution.name}
          </h3>
          
          <p className="text-gray-600 mb-4 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {contribution.location}
          </p>
          
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <ImageIcon className="w-4 h-4 mr-1" />
                {contribution.mediaCount}
              </span>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs">
                {contribution.category}
              </span>
            </div>
            <span>{contribution.relativeTime}</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {contribution.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs"
              >
                {tag}
              </span>
            ))}
            {contribution.tags.length > 2 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
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
};
