'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { contentDetailService, ContentDetailProvider } from '@/services/business/ContentDetailService';
import { workContentService } from '@/services/business/WorkContentService';
import type { ContentDetail } from '@/types/content-detail';
import { WorkContent } from '@/components/pages/WorkContent';
import { logger } from '@/services/core/LoggingService';

// Register work provider (cast needed due to generic type constraints)
contentDetailService.registerProvider(
  'work',
  workContentService as ContentDetailProvider
);

export default function WorkDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workId = params.id as string;
  
  const [contentDetail, setContentDetail] = useState<ContentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch work opportunity details
  useEffect(() => {
    const loadWork = async () => {
      if (!workId) return;

      try {
        logger.info('Loading work opportunity details', {
          service: 'WorkDetailPage',
          method: 'loadWork',
          workId,
        });

        const result = await workContentService.getContentDetail(workId);
        
        if (result.success && result.content) {
          setContentDetail(result.content);
          logger.info('Work opportunity loaded', {
            service: 'WorkDetailPage',
            method: 'loadWork',
            workId,
            title: result.content.title,
          });
        } else {
          logger.warn('Work opportunity not found', {
            service: 'WorkDetailPage',
            method: 'loadWork',
            workId,
            error: result.error,
          });
        }
      } catch (error) {
        logger.error('Error loading work opportunity', error instanceof Error ? error : new Error('Unknown error'), {
          service: 'WorkDetailPage',
          method: 'loadWork',
          workId,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (isClient) {
      loadWork();
    }
  }, [workId, isClient]);

  // Wait for client-side hydration
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container-width section-padding">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-blue-600 text-lg">Loading work opportunity...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!contentDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="container-width section-padding">
          <div className="text-center py-16">
            <h2 className="text-2xl font-serif font-bold text-blue-800 mb-4">
              Work Opportunity Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The work opportunity you&apos;re looking for doesn&apos;t exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/work')}
              className="btn-primary-sm"
            >
              Browse Opportunities
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Work detail content
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <section className="section-padding">
        <div className="container-width">
          <WorkContent detail={contentDetail} backHref="/work" />
        </div>
      </section>
    </div>
  );
}
