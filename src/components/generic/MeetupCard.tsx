import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Calendar, Users, Video, Tag } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';
import type { MeetupCardData } from '@/types/meetup';

interface MeetupCardProps {
  meetup: MeetupCardData;
  variant?: 'grid' | 'list' | 'featured';
  showRSVPButton?: boolean;
  onRSVP?: (meetupId: string, status: 'accepted' | 'declined' | 'tentative') => void;
}

/**
 * Meetup Card Component
 * Displays meetups in public browse/explore views
 * 
 * SOA Layer: Presentation (UI only, no business logic)
 * 
 * Variants:
 * - grid: Standard grid card (default)
 * - list: Horizontal list layout
 * - featured: Large featured card with emphasis
 * 
 * Features:
 * - Responsive design
 * - Multiple layout variants
 * - RSVP button integration
 * - Time-based status display
 * - Virtual/physical indicators
 */
export const MeetupCard: React.FC<MeetupCardProps> = ({ 
  meetup, 
  variant = 'grid',
  showRSVPButton = true,
  onRSVP
}) => {
  // Utility functions
  const getMeetupTypeInfo = (type: string) => {
    const typeMap: Record<string, { id: string; name: string; icon: string }> = {
      'gathering': { id: 'gathering', name: 'Social Gathering', icon: '👥' },
      'workshop': { id: 'workshop', name: 'Workshop', icon: '🛠️' },
      'conference': { id: 'conference', name: 'Conference', icon: '🎤' },
      'casual': { id: 'casual', name: 'Casual Meetup', icon: '☕' },
      'networking': { id: 'networking', name: 'Networking', icon: '🤝' },
      'other': { id: 'other', name: 'Other', icon: '📅' },
    };
    return typeMap[type.toLowerCase()] || { id: type, name: type, icon: '📅' };
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isUpcoming = () => {
    const now = Math.floor(Date.now() / 1000);
    return meetup.startTime > now;
  };

  const getDaysUntil = () => {
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = meetup.startTime - now;
    const days = Math.floor(diffSeconds / 86400);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return 'Past';
    return `In ${days} days`;
  };

  // Handlers
  const handleRSVP = (e: React.MouseEvent, status: 'accepted' | 'declined' | 'tentative') => {
    e.preventDefault();
    e.stopPropagation();
    
    logger.info('RSVP clicked', {
      component: 'MeetupCard',
      method: 'handleRSVP',
      meetupId: meetup.id,
      status,
    });
    
    onRSVP?.(meetup.id, status);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    logger.warn('Meetup image failed to load', {
      component: 'MeetupCard',
      method: 'handleImageError',
      meetupId: meetup.id,
      imageUrl: meetup.imageUrl,
    });
    
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    const parent = target.parentElement;
    if (parent) {
      parent.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-purple-100">
          <svg class="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
      `;
    }
  };

  const typeInfo = getMeetupTypeInfo(meetup.meetupType);
  const upcoming = isUpcoming();
  const daysUntil = getDaysUntil();

  // Featured variant
  if (variant === 'featured') {
    return (
      <Link href={`/meet/${meetup.dTag}`} className="block cursor-pointer">
        <div className="culture-card group p-0 overflow-hidden">
          <div className="relative aspect-video">
            {meetup.imageUrl ? (
              <Image
                src={meetup.imageUrl}
                alt={meetup.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-100">
                <svg className="w-16 h-16 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            <div className="absolute top-4 right-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              Featured
            </div>
            
            {meetup.isVirtual && (
              <div className="absolute top-4 left-4 bg-blue-500/95 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                <span className="font-medium">Virtual</span>
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 rounded-lg p-4 text-white">
                <p className="text-sm opacity-90 flex items-center mb-2">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(meetup.startTime)} at {formatTime(meetup.startTime)}
                </p>
                <p className="text-sm opacity-90 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  {meetup.location}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-xl font-serif font-bold text-purple-800 mb-2 line-clamp-2">
              {meetup.name}
            </h3>
            
            <p className="text-gray-700 mb-4 line-clamp-3">{meetup.description}</p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                {typeInfo.icon} {typeInfo.name}
              </span>
              {upcoming && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  {daysUntil}
                </span>
              )}
              {meetup.rsvpCount && meetup.rsvpCount.accepted > 0 && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {meetup.rsvpCount.accepted} Going
                </span>
              )}
            </div>
            
            {meetup.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {meetup.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="bg-accent-50 text-accent-700 text-xs rounded-full font-medium px-2 py-1"
                  >
                    #{tag}
                  </span>
                ))}
                {meetup.tags.length > 3 && (
                  <span className="text-gray-500 text-xs">
                    +{meetup.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
            
            {showRSVPButton && upcoming && (
              <button
                onClick={(e) => handleRSVP(e, 'accepted')}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <Users className="w-4 h-4" />
                RSVP to Event
              </button>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // List variant
  if (variant === 'list') {
    return (
      <Link href={`/meet/${meetup.dTag}`} className="block cursor-pointer">
        <div className="culture-card group flex gap-4 hover:shadow-lg transition-shadow">
          <div className="relative w-48 h-48 flex-shrink-0">
            {meetup.imageUrl ? (
              <Image
                src={meetup.imageUrl}
                alt={meetup.name}
                fill
                sizes="192px"
                className="object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-purple-100 rounded-lg">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {meetup.isVirtual && (
              <div className="absolute top-2 right-2 bg-blue-500/95 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                <Video className="w-3 h-3" />
                Virtual
              </div>
            )}
          </div>
          
          <div className="flex-1 flex flex-col justify-between py-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                {meetup.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{meetup.description}</p>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(meetup.startTime)}</span>
                </div>
                {upcoming && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {daysUntil}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-1">{meetup.location}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                  {typeInfo.icon} {typeInfo.name}
                </span>
                {meetup.rsvpCount && meetup.rsvpCount.accepted > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {meetup.rsvpCount.accepted} Going
                  </span>
                )}
              </div>
            </div>
            
            {showRSVPButton && upcoming && (
              <button
                onClick={(e) => handleRSVP(e, 'accepted')}
                className="btn btn-outline btn-sm flex items-center gap-2 mt-2 self-start"
              >
                <Users className="w-3 h-3" />
                RSVP
              </button>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link href={`/meet/${meetup.dTag}`} className="block cursor-pointer">
      <div className="culture-card group hover:shadow-xl transition-all duration-300">
        <div className="relative aspect-[4/3] bg-gray-50 rounded-t-lg overflow-hidden">
          {meetup.imageUrl ? (
            <Image
              src={meetup.imageUrl}
              alt={meetup.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-purple-100">
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          
          {meetup.isVirtual && (
            <div className="absolute top-3 left-3 bg-blue-500/95 text-white px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
              <Video className="w-3 h-3" />
              Virtual
            </div>
          )}
          
          {upcoming && (
            <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-bold text-purple-900 shadow-lg">
              {daysUntil}
            </div>
          )}
        </div>
        
        <div className="p-4 space-y-3">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {meetup.name}
          </h3>
          
          <p className="text-sm text-gray-600 line-clamp-2">
            {meetup.description}
          </p>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(meetup.startTime)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{meetup.location}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
              {typeInfo.icon} {typeInfo.name}
            </span>
            {meetup.rsvpCount && meetup.rsvpCount.accepted > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {meetup.rsvpCount.accepted}
              </span>
            )}
          </div>
          
          {meetup.tags.length > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                <span>{meetup.tags.length} {meetup.tags.length === 1 ? 'tag' : 'tags'}</span>
              </div>
            </div>
          )}
          
          {showRSVPButton && upcoming && (
            <button
              onClick={(e) => handleRSVP(e, 'accepted')}
              className="btn btn-outline w-full text-sm flex items-center justify-center gap-2 mt-2"
            >
              <Users className="w-4 h-4" />
              RSVP to Event
            </button>
          )}
        </div>
      </div>
    </Link>
  );
};
