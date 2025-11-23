import React from 'react';
import Image from 'next/image';
import { Clock, MapPin, Calendar, Users, Video } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';
import { getRelativeTime } from '@/utils/dateUtils';
import type { MeetupCardData } from '@/types/meetup';
import { MEETUP_CONFIG } from '@/config/meetup';

interface MyMeetupCardProps {
  meetup: MeetupCardData;
  onEdit?: (meetup: MeetupCardData) => void;
  onDelete?: (meetup: MeetupCardData) => void;
}

/**
 * My Meetup Card Component
 * Displays user's own meetups in /my-meet page
 * 
 * SOA Layer: Presentation (UI only, no business logic)
 * 
 * Features:
 * - Responsive design
 * - Edit/delete/view buttons
 * - Visual indicators for virtual/physical meetups
 * - RSVP count display
 * - Time-based status (upcoming/past)
 */
export const MyMeetupCard: React.FC<MyMeetupCardProps> = ({ 
  meetup, 
  onEdit,
  onDelete
}) => {
  // Utility functions
  const getMeetupTypeInfo = (type: string) => {
    // Map type to display info with icons
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

  const getTotalRSVPs = () => {
    if (!meetup.rsvpCount) return 0;
    return meetup.rsvpCount.accepted + meetup.rsvpCount.declined + meetup.rsvpCount.tentative;
  };

  // Handlers
  const handleEdit = () => {
    logger.info('Edit meetup clicked', {
      component: 'MyMeetupCard',
      method: 'handleEdit',
      meetupId: meetup.id,
      name: meetup.name,
    });
    onEdit?.(meetup);
  };

  const handleDelete = () => {
    logger.info('Delete meetup clicked', {
      component: 'MyMeetupCard',
      method: 'handleDelete',
      meetupId: meetup.id,
      name: meetup.name,
    });
    onDelete?.(meetup);
  };

  const handleView = () => {
    logger.info('View meetup clicked', {
      component: 'MyMeetupCard',
      method: 'handleView',
      meetupId: meetup.id,
      dTag: meetup.dTag,
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    logger.warn('Meetup image failed to load', {
      component: 'MyMeetupCard',
      method: 'handleImageError',
      meetupId: meetup.id,
      imageUrl: meetup.media.images[0]?.url,
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
  const totalRSVPs = getTotalRSVPs();

  return (
    <div className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Meetup Image */}
      <div className="relative aspect-[4/3] bg-purple-50">
        {meetup.media.images.length > 0 ? (
          <Image
            src={meetup.media.images[0].url}
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
        
        {/* Status Badge - Top Left */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
            upcoming 
              ? 'bg-green-500/95 text-white' 
              : 'bg-gray-500/95 text-white'
          }`}>
            {upcoming ? 'Upcoming' : 'Past'}
          </span>
        </div>

        {/* Virtual Badge - Top Right */}
        {meetup.isVirtual && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/95 text-white flex items-center gap-1">
              <Video className="w-3 h-3" />
              Virtual
            </span>
          </div>
        )}

        {/* Created Time Badge - Bottom Right */}
        <div className="absolute bottom-3 right-3">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-white/90 text-gray-700 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {getRelativeTime(meetup.createdAt)}
          </span>
        </div>
      </div>
      
      {/* Meetup Info */}
      <div className="p-6">
        <h3 className="text-xl font-serif font-bold text-purple-800 mb-2 line-clamp-2">
          {meetup.name}
        </h3>
        
        <p className="text-base mb-4 line-clamp-3 leading-relaxed text-purple-600">
          {meetup.description}
        </p>
        
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(meetup.startTime)} at {formatTime(meetup.startTime)}</span>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{meetup.location}</span>
        </div>

        {/* Type and RSVP Count */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full font-medium text-sm bg-purple-100 text-purple-700">
            {typeInfo.icon} {typeInfo.name}
          </span>
          {meetup.rsvpCount && (
            <span className="px-3 py-1 rounded-full font-medium text-sm bg-green-100 text-green-700 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {meetup.rsvpCount.accepted} Going
              {totalRSVPs > meetup.rsvpCount.accepted && ` • ${totalRSVPs} Total`}
            </span>
          )}
        </div>

        {/* Tags */}
        {meetup.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {meetup.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-accent-50 text-accent-700 text-xs rounded-full font-medium px-2 py-1"
              >
                #{tag}
              </span>
            ))}
            {meetup.tags.length > 3 && (
              <span className="text-gray-500 text-xs py-1">
                +{meetup.tags.length - 3} more
              </span>
            )}
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <a
            href={`/meet/${meetup.dTag}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleView}
            className="btn-outline-sm flex items-center justify-center px-3"
            title="View meetup"
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
