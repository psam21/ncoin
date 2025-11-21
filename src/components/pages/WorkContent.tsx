'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, Share2, Briefcase, Calendar, DollarSign } from 'lucide-react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { ContentMetaInfo } from '@/components/generic/ContentMetaInfo';
import { logger } from '@/services/core/LoggingService';
import type { ContentDetail } from '@/types/content-detail';
import type { InfoItem } from '@/components/generic/ContentDetailInfo';

interface WorkContentProps {
  detail: ContentDetail;
  backHref?: string;
}

export function WorkContent({ detail, backHref = '/work' }: WorkContentProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleContactPoster = () => {
    const contactAction = detail.actions.find(action => action.id === 'contact-poster');
    if (!contactAction || !contactAction.metadata) {
      logger.warn('Contact poster action has no metadata', {
        service: 'WorkContent',
        method: 'handleContactPoster',
      });
      return;
    }

    const metadata = contactAction.metadata as {
      posterPubkey: string;
      workId: string;
      workTitle: string;
      workImageUrl?: string;
    };
    const { posterPubkey, workId, workTitle, workImageUrl } = metadata;

    logger.info('Navigating to messages for poster', {
      service: 'WorkContent',
      method: 'handleContactPoster',
      posterPubkey,
      workId,
    });

    // Navigate to messages with context
    const params = new URLSearchParams({
      recipient: posterPubkey,
      context: `work:${workId}`,
      contextTitle: workTitle || 'Work Opportunity',
      ...(workImageUrl && { contextImage: workImageUrl }),
    });

    router.push(`/messages?${params.toString()}`);
  };

  const actions = useMemo(() => {
    const filtered = detail.actions.filter(action => 
      action.id !== 'report' && 
      action.id !== 'share' &&
      action.id !== 'contact-poster'
    );
    return filtered;
  }, [detail.actions]);

  const shareAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'share');
  }, [detail.actions]);

  const contactAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'contact-poster');
  }, [detail.actions]);

  // Format pay rate display
  const formatPayRate = (rate: number, currency: string) => {
    const lowerCurrency = currency.toLowerCase();
    if (lowerCurrency === 'btc') return `${rate} BTC`;
    if (lowerCurrency === 'sats') return `${rate} sats`;
    if (lowerCurrency === 'usd') return `$${rate}`;
    if (lowerCurrency === 'per-hour') return `${rate}/hr`;
    if (lowerCurrency === 'per-day') return `${rate}/day`;
    if (lowerCurrency === 'per-project') return `${rate}/project`;
    return `${rate} ${currency}`;
  };

  // Get job type icon
  const getJobTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('remote')) return '🌍';
    if (lowerType.includes('on-site')) return '🏢';
    if (lowerType.includes('hybrid')) return '🔄';
    return '💼';
  };

  // All work metadata in a single comprehensive grid
  const allMetadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];

    if (detail.customFields.jobType) {
      items.push({
        label: 'Job Type',
        value: `${getJobTypeIcon(String(detail.customFields.jobType))} ${detail.customFields.jobType}`,
        emphasis: true,
      });
    }

    if (detail.customFields.payRate !== undefined && detail.customFields.currency) {
      items.push({
        label: 'Pay Rate',
        value: formatPayRate(Number(detail.customFields.payRate), String(detail.customFields.currency)),
        emphasis: true,
      });
    }

    if (detail.customFields.duration) {
      items.push({
        label: 'Duration',
        value: String(detail.customFields.duration),
        emphasis: true,
      });
    }

    if (detail.customFields.category) {
      items.push({
        label: 'Category',
        value: String(detail.customFields.category),
      });
    }

    if (detail.customFields.region) {
      items.push({
        label: 'Region',
        value: String(detail.customFields.region),
      });
    }

    if (detail.customFields.country) {
      items.push({
        label: 'Country',
        value: String(detail.customFields.country),
      });
    }

    if (detail.customFields.location) {
      items.push({
        label: 'Location',
        value: String(detail.customFields.location),
      });
    }

    if (detail.customFields.language) {
      items.push({
        label: 'Language',
        value: String(detail.customFields.language),
      });
    }

    if (detail.customFields.contact) {
      items.push({
        label: 'Contact Info',
        value: String(detail.customFields.contact),
        emphasis: true,
      });
    }

    return items;
  }, [detail.customFields]);

  const tags = useMemo(() => {
    return (detail.tags ?? []).filter(tag => tag.toLowerCase() !== 'nostr-for-nomads-work');
  }, [detail.tags]);

  return (
    <div className="space-y-10">
      <ContentDetailHeader
        title={detail.title}
        actions={actions}
        backHref={backHref}
        backLabel="Back to work opportunities"
        customButtons={
          <>
            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className={`btn-outline-sm inline-flex items-center justify-center ${
                isLiked ? '!border-red-300 !bg-red-50 !text-red-700 hover:!bg-red-100' : ''
              }`}
              aria-label={isLiked ? 'Unlike work opportunity' : 'Like work opportunity'}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            
            <button
              type="button"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`btn-outline-sm inline-flex items-center justify-center ${
                isBookmarked ? '!border-purple-300 !bg-purple-50 !text-purple-700 hover:!bg-purple-100' : ''
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark work opportunity'}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-purple-500 text-purple-500' : ''}`} />
            </button>
            
            {shareAction && (
              <button
                type="button"
                onClick={shareAction.onClick}
                className="btn-outline-sm inline-flex items-center justify-center"
                aria-label="Share work opportunity"
              >
                <Share2 className="h-4 w-4" />
              </button>
            )}
          </>
        }
      />

      <ContentDetailLayout
        media={<ContentMediaGallery items={detail.media} />}
        main={
          <section
            aria-labelledby="work-details"
            className="space-y-5 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-primary-100"
          >
            <h2
              id="work-details"
              className="text-sm font-semibold uppercase tracking-wide text-gray-500 flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Work Opportunity Details
            </h2>

            {allMetadata.length > 0 && (
              <dl className="grid grid-cols-1 gap-4 rounded-2xl bg-white/70 p-4 shadow-inner ring-1 ring-primary-100 md:grid-cols-2">
                {allMetadata.map(item => (
                  <div key={item.label}>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">{item.label}</dt>
                    <dd
                      className={`mt-1 text-base font-medium ${item.emphasis ? 'text-primary-900' : 'text-gray-700'}`}
                    >
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Key Highlights */}
            <div className="mt-6 grid grid-cols-3 gap-4 rounded-2xl bg-primary-50 p-6">
              {!!detail.customFields.jobType && (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Briefcase className="h-5 w-5 text-primary-600" />
                  </div>
                  <p className="text-sm font-medium text-primary-900">{String(detail.customFields.jobType)}</p>
                  <p className="text-xs text-gray-600">Job Type</p>
                </div>
              )}
              
              {!!detail.customFields.duration && (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-5 w-5 text-primary-600" />
                  </div>
                  <p className="text-sm font-medium text-primary-900">{String(detail.customFields.duration)}</p>
                  <p className="text-xs text-gray-600">Duration</p>
                </div>
              )}

              {detail.customFields.payRate !== undefined && !!detail.customFields.currency && (
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-green-900">
                    {formatPayRate(Number(detail.customFields.payRate), String(detail.customFields.currency))}
                  </p>
                  <p className="text-xs text-gray-600">Pay Rate</p>
                </div>
              )}
            </div>
          </section>
        }
        sidebar={
          <div className="space-y-4">
            <ContentMetaInfo
              publishedAt={detail.publishedAt}
              updatedAt={detail.updatedAt}
              author={detail.author}
              relays={detail.relays}
            />
            {contactAction && (
              <button
                type="button"
                onClick={handleContactPoster}
                className="btn-primary-sm w-full"
                aria-label={contactAction.ariaLabel ?? contactAction.label}
                disabled={contactAction.disabled}
              >
                {contactAction.label}
              </button>
            )}
          </div>
        }
        footer={
          <ContentDetailInfo
            title="About this opportunity"
            description={detail.description}
            tags={tags}
          />
        }
      />
    </div>
  );
}
