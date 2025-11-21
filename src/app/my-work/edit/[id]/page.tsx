'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchWorkById } from '@/services/business/WorkService';
import type { WorkEvent } from '@/types/work';
import { WorkForm } from '@/components/pages/WorkForm';
import type { GenericAttachment } from '@/types/attachments';
import { logger } from '@/services/core/LoggingService';

export default function WorkEditPage() {
  const router = useRouter();
  const params = useParams();
  const workId = params.id as string;
  
  const { isAuthenticated, user } = useAuthStore();
  const [work, setWork] = useState<WorkEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch the work opportunity to edit
  useEffect(() => {
    const loadWork = async () => {
      if (!workId) return;

      try {
        logger.info('Loading work opportunity for editing', {
          service: 'WorkEditPage',
          method: 'loadWork',
          workId,
        });

        const data = await fetchWorkById(workId);
        
        if (data) {
          // Check if user owns this work opportunity
          if (user?.pubkey && data.pubkey !== user.pubkey) {
            logger.warn('User does not own this work opportunity', {
              service: 'WorkEditPage',
              method: 'loadWork',
              workId,
              userPubkey: user.pubkey,
              workPubkey: data.pubkey,
            });
            router.push('/my-work');
            return;
          }
          
          setWork(data);
          logger.info('Work opportunity loaded for editing', {
            service: 'WorkEditPage',
            method: 'loadWork',
            workId,
            title: data.title,
          });
        } else {
          logger.warn('Work opportunity not found', {
            service: 'WorkEditPage',
            method: 'loadWork',
            workId,
          });
        }
      } catch (error) {
        logger.error('Error loading work opportunity', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'WorkEditPage',
          method: 'loadWork',
          workId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isClient && user) {
      loadWork();
    }
  }, [workId, isClient, user, router]);

  // Convert WorkEvent to form defaultValues
  const formDefaultValues = useMemo(() => {
    if (!work) return undefined;

    // Convert media URLs to GenericAttachment format
    const attachments: GenericAttachment[] = [];
    
    // Add images
    work.media.images.forEach((media, index) => {
      attachments.push({
        id: `image-${index}`,
        type: 'image',
        name: `Image ${index + 1}`,
        size: 0, // Size not available from WorkEvent media
        mimeType: media.mimeType || 'image/jpeg',
        url: media.url,
        hash: media.hash,
      });
    });

    // Add videos
    work.media.videos.forEach((media, index) => {
      attachments.push({
        id: `video-${index}`,
        type: 'video',
        name: `Video ${index + 1}`,
        size: 0, // Size not available from WorkEvent media
        mimeType: media.mimeType || 'video/mp4',
        url: media.url,
        hash: media.hash,
      });
    });

    // Add audio
    work.media.audio.forEach((media, index) => {
      attachments.push({
        id: `audio-${index}`,
        type: 'audio',
        name: `Audio ${index + 1}`,
        size: 0, // Size not available from WorkEvent media
        mimeType: media.mimeType || 'audio/mpeg',
        url: media.url,
        hash: media.hash,
      });
    });

    return {
      title: work.title,
      description: work.description,
      category: work.category,
      jobType: work.jobType,
      duration: work.duration,
      payRate: String(work.payRate),
      currency: work.currency,
      contact: work.contact,
      language: work.language,
      location: work.location,
      region: work.region,
      country: work.country,
      tags: work.tags,
      attachments,
      dTag: work.dTag,
      workId: work.id,
    };
  }, [work]);

  const handleWorkUpdated = (workId: string) => {
    // Redirect to work detail page after successful update
    router.push(`/work/${workId}`);
  };

  const handleCancel = () => {
    router.push('/my-work');
  };

  // Wait for client-side hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication
  if (!isAuthenticated) {
    router.push('/signin');
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width section-padding">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-primary-600 text-lg">Loading work opportunity...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!work) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width section-padding">
          <div className="text-center py-16">
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">
              Work Opportunity Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The work opportunity you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/my-work')}
              className="btn-primary-sm"
            >
              Back to My Opportunities
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Edit form
  return (
    <div className="min-h-screen bg-primary-50">
      <section className="section-padding">
        <div className="container-width">
          <div className="max-w-4xl mx-auto mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">
              Edit Work Opportunity
            </h1>
            <p className="text-gray-600">
              Update your work opportunity details below
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <WorkForm
              onWorkCreated={handleWorkUpdated}
              onCancel={handleCancel}
              defaultValues={formDefaultValues}
              isEditMode={true}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
