'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Clock, Users, Video, Globe, Share2, Edit, Trash2 } from 'lucide-react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { RSVPButton } from '@/components/generic/RSVPButton';
import { AttendeesList } from '@/components/generic/AttendeesList';
import { DeleteConfirmationModal } from '@/components/generic/DeleteConfirmationModal';
import { useRSVP } from '@/hooks/useRSVP';
import { useAuthStore } from '@/stores/useAuthStore';
import { logger } from '@/services/core/LoggingService';
import type { MeetupEvent } from '@/types/meetup';
import type { ContentMediaItem } from '@/types/content-media';

interface MeetupDetailProps {
  meetup: MeetupEvent;
  backHref?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MeetupDetail({ meetup, backHref = '/meet', onEdit, onDelete }: MeetupDetailProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Wait for client-side hydration to complete
  useEffect(() => {
    setMounted(true);
  }, []);

  // RSVP management
  const {
    myRSVP,
    allRSVPs,
    isSubmitting: rsvpLoading,
    rsvp: handleRSVP,
    getRSVPCounts,
  } = useRSVP(meetup.dTag, meetup.hostPubkey);

  // Only compute these after mount to avoid hydration mismatch
  const isOwner = mounted ? user?.pubkey === meetup.hostPubkey : false;
  const isUpcoming = mounted ? meetup.startTime > Math.floor(Date.now() / 1000) : false;

  const handleShare = async () => {
    const url = `${window.location.origin}/meet/${encodeURIComponent(meetup.dTag)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: meetup.name,
          text: meetup.description.slice(0, 200),
          url,
        });
        logger.info('Meetup shared via Web Share API', {
          service: 'MeetupDetail',
          method: 'handleShare',
          meetupId: meetup.id,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          logger.error('Error sharing meetup', err as Error, {
            service: 'MeetupDetail',
            method: 'handleShare',
          });
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        logger.info('Meetup link copied to clipboard', {
          service: 'MeetupDetail',
          method: 'handleShare',
          meetupId: meetup.id,
        });
      } catch (err) {
        logger.error('Error copying to clipboard', err as Error, {
          service: 'MeetupDetail',
          method: 'handleShare',
        });
      }
    }
  };

  const handleAddToCalendar = () => {
    // Generate .ics file
    const startDate = new Date(meetup.startTime * 1000);
    const endDate = meetup.endTime ? new Date(meetup.endTime * 1000) : new Date(startDate.getTime() + 3600000); // +1hr default
    
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Nostr for Nomads//Meet//EN',
      'BEGIN:VEVENT',
      `UID:${meetup.id}@nostr-for-nomads`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${meetup.name}`,
      `DESCRIPTION:${meetup.description.replace(/\n/g, '\\n')}`,
      `LOCATION:${meetup.location}`,
      meetup.virtualLink ? `URL:${meetup.virtualLink}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${meetup.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    logger.info('Calendar event downloaded', {
      service: 'MeetupDetail',
      method: 'handleAddToCalendar',
      meetupId: meetup.id,
    });
  };

  const handleContactHost = () => {
    logger.info('Navigating to messages for host', {
      service: 'MeetupDetail',
      method: 'handleContactHost',
      hostPubkey: meetup.hostPubkey,
      meetupId: meetup.id,
    });

    const params = new URLSearchParams({
      recipient: meetup.hostPubkey,
      context: `meetup:${meetup.dTag}`,
      contextTitle: meetup.name,
      ...(meetup.media.images.length > 0 && { contextImage: meetup.media.images[0].url }),
    });

    router.push(`/messages?${params.toString()}`);
  };

  const handleDeleteConfirm = () => {
    setShowDeleteModal(false);
    onDelete?.();
  };

  // Convert meetup media to ContentMediaGallery format
  const mediaItems: ContentMediaItem[] = useMemo(() => {
    const items: ContentMediaItem[] = [];

    // Add images
    meetup.media.images.forEach((img, idx) => {
      items.push({
        id: `image-${idx}`,
        type: 'image' as const,
        source: {
          url: img.url,
          mimeType: img.mimeType || 'image/jpeg',
          hash: img.hash,
          size: img.size,
        },
      });
    });

    // Add videos
    meetup.media.videos.forEach((vid, idx) => {
      items.push({
        id: `video-${idx}`,
        type: 'video' as const,
        source: {
          url: vid.url,
          mimeType: vid.mimeType || 'video/mp4',
          hash: vid.hash,
          size: vid.size,
        },
      });
    });

    // Add audio
    meetup.media.audio.forEach((aud, idx) => {
      items.push({
        id: `audio-${idx}`,
        type: 'audio' as const,
        source: {
          url: aud.url,
          mimeType: aud.mimeType || 'audio/mpeg',
          hash: aud.hash,
          size: aud.size,
        },
      });
    });

    return items;
  }, [meetup.media]);

  // Format date and time
  const formattedDate = useMemo(() => {
    const date = new Date(meetup.startTime * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  }, [meetup.startTime]);

  const formattedTime = useMemo(() => {
    const startDate = new Date(meetup.startTime * 1000);
    const startTime = startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    });

    if (meetup.endTime) {
      const endDate = new Date(meetup.endTime * 1000);
      const endTime = endDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      });
      return `${startTime} - ${endTime}`;
    }

    return startTime;
  }, [meetup.startTime, meetup.endTime]);

  // RSVP counts - use live data from hook instead of static prop
  const rsvpCounts = useMemo(() => {
    const counts = getRSVPCounts();
    return {
      ...counts,
      total: counts.accepted + counts.tentative + counts.declined,
    };
  }, [getRSVPCounts]);

  // Filter out system tags
  const tags = useMemo(() => {
    return meetup.tags.filter(tag => tag.toLowerCase() !== 'nostr-for-nomads-meetup');
  }, [meetup.tags]);

  // Header actions (owner only)
  const headerActions = useMemo(() => {
    // Wait for client hydration before showing owner actions
    if (!mounted || !isOwner) return [];

    return [
      {
        id: 'edit-meetup',
        label: 'Edit',
        icon: <Edit className="w-4 h-4" />,
        onClick: onEdit || (() => router.push(`/my-meet/edit/${meetup.dTag}`)),
        type: 'secondary' as const,
      },
      {
        id: 'delete-meetup',
        label: 'Delete',
        icon: <Trash2 className="w-4 h-4" />,
        onClick: () => setShowDeleteModal(true),
        type: 'secondary' as const,
      },
    ];
  }, [mounted, isOwner, onEdit, meetup.dTag, router]);

  return (
    <div className="space-y-10">
      <ContentDetailHeader
        title={meetup.name}
        actions={headerActions}
        backHref={backHref}
        backLabel="Back to meetups"
        customButtons={
          mounted ? (
            <>
              <button
                type="button"
                onClick={handleAddToCalendar}
                className="btn-outline-sm inline-flex items-center justify-center gap-2"
                aria-label="Add to calendar"
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Add to Calendar</span>
              </button>
              
              <button
                type="button"
                onClick={handleShare}
                className="btn-outline-sm inline-flex items-center justify-center"
                aria-label="Share meetup"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </>
          ) : null
        }
      />

      <ContentDetailLayout
        media={
          <>
            {mediaItems.length > 0 ? (
              <ContentMediaGallery items={mediaItems} />
            ) : (
              <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-24 h-24 text-purple-300" />
              </div>
            )}
          </>
        }
        main={
          <div className="space-y-6">
            {/* Event Details Section */}
            <section
              aria-labelledby="event-details"
              className="space-y-5 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-primary-100"
            >
              <h2
                id="event-details"
                className="text-sm font-semibold uppercase tracking-wide text-gray-500"
              >
                Event Details
              </h2>

              {/* Date & Time */}
              <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-inner ring-1 ring-primary-200 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-full shadow-sm flex-shrink-0">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="text-lg font-bold text-purple-900" suppressHydrationWarning>{formattedDate}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-full shadow-sm flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Time</p>
                    <p className="text-lg font-bold text-blue-900" suppressHydrationWarning>{formattedTime}</p>
                    {meetup.timezone && (
                      <p className="text-sm text-gray-600 mt-1">{meetup.timezone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="rounded-2xl bg-white/70 p-6 shadow-inner ring-1 ring-primary-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-50 rounded-full flex-shrink-0">
                    {meetup.isVirtual ? (
                      <Video className="w-6 h-6 text-purple-600" />
                    ) : (
                      <MapPin className="w-6 h-6 text-purple-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">
                      {meetup.isVirtual ? 'Virtual Event' : 'Location'}
                    </p>
                    <p className="text-base font-medium text-gray-900">{meetup.location}</p>
                    {meetup.isVirtual && meetup.virtualLink && (
                      <a
                        href={meetup.virtualLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
                      >
                        <Globe className="w-4 h-4" />
                        Join Virtual Meeting
                      </a>
                    )}
                    {!meetup.isVirtual && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(meetup.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mt-2"
                      >
                        <MapPin className="w-4 h-4" />
                        View on Map
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* RSVP Section */}
              {mounted && isUpcoming && user && (
                <div className="rounded-2xl bg-white/70 p-6 shadow-inner ring-1 ring-primary-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Your RSVP</p>
                      <p className="text-base font-medium text-gray-900">
                        {rsvpCounts.accepted} Going · {rsvpCounts.tentative} Maybe · {rsvpCounts.declined} Can&apos;t Go
                      </p>
                    </div>
                  </div>
                  <RSVPButton
                    currentStatus={myRSVP?.status || null}
                    onStatusChange={handleRSVP}
                    isLoading={rsvpLoading}
                    size="lg"
                  />
                </div>
              )}
            </section>

            {/* Attendees Section */}
            {allRSVPs.length > 0 && (
              <section
                aria-labelledby="attendees"
                className="space-y-5 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-primary-100"
              >
                <div className="flex items-center justify-between">
                  <h2
                    id="attendees"
                    className="text-sm font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Attendees
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{rsvpCounts.total} RSVPs</span>
                  </div>
                </div>

                <AttendeesList
                  rsvps={allRSVPs}
                  showStatusFilter={true}
                  maxDisplay={10}
                  variant="compact"
                />
              </section>
            )}
          </div>
        }
        sidebar={
          <div className="space-y-4">
            {/* Host Info */}
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-primary-100">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Host
              </h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {meetup.hostPubkey.slice(0, 8)}...{meetup.hostPubkey.slice(-8)}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(meetup.hostPubkey)}
                    className="text-xs text-purple-600 hover:text-purple-700"
                  >
                    Copy pubkey
                  </button>
                </div>
              </div>
              {mounted && !isOwner && (
                <button
                  type="button"
                  onClick={handleContactHost}
                  className="btn-primary-sm w-full"
                  aria-label="Contact host via messages"
                >
                  Contact Host
                </button>
              )}
            </div>

            {/* Meetup Type */}
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-primary-100">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Event Type
              </h3>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-700">
                {meetup.meetupType.charAt(0).toUpperCase() + meetup.meetupType.slice(1)}
              </span>
            </div>

            {/* Event Meta Info */}
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-primary-100">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
                Event Info
              </h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Status</dt>
                  <dd className="text-gray-900 font-medium">
                    {mounted ? (
                      isUpcoming ? (
                        <span className="text-green-600">Upcoming</span>
                      ) : (
                        <span className="text-gray-500">Past Event</span>
                      )
                    ) : (
                      <span className="text-gray-400">Loading...</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Published</dt>
                  <dd className="text-gray-900 font-medium" suppressHydrationWarning>
                    {new Date(meetup.publishedAt * 1000).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">Event ID</dt>
                  <dd className="text-gray-900 font-mono text-xs break-all">
                    {meetup.dTag}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        }
        footer={
          <ContentDetailInfo
            title="About this event"
            description={meetup.description}
            tags={tags}
          />
        }
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Meetup"
        message={`Are you sure you want to delete "${meetup.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
