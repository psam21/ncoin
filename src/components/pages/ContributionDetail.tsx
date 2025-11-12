'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { ContentDetailHeader } from '@/components/generic/ContentDetailHeader';
import { ContentDetailLayout } from '@/components/generic/ContentDetailLayout';
import { ContentMediaGallery } from '@/components/generic/ContentMediaGallery';
import { ContentDetailInfo } from '@/components/generic/ContentDetailInfo';
import { ContentMetaInfo } from '@/components/generic/ContentMetaInfo';
import { logger } from '@/services/core/LoggingService';
import type { ContentDetail } from '@/types/content-detail';
import type { InfoItem } from '@/components/generic/ContentDetailInfo';

interface ContributionDetailProps {
  detail: ContentDetail;
  backHref?: string;
}

export function ContributionDetail({ detail, backHref = '/explore' }: ContributionDetailProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleContactContributor = () => {
    const contactAction = detail.actions.find(action => action.id === 'contact-author');
    if (!contactAction || !contactAction.metadata) {
      logger.warn('Contact author action has no metadata', {
        service: 'ContributionDetail',
        method: 'handleContactContributor',
      });
      return;
    }

    const metadata = contactAction.metadata as {
      contributorPubkey: string;
      contributionId: string;
      contributionTitle: string;
      contributionImageUrl?: string;
    };
    const { contributorPubkey, contributionId, contributionTitle, contributionImageUrl } = metadata;

    logger.info('Navigating to messages for contributor', {
      service: 'ContributionDetail',
      method: 'handleContactContributor',
      contributorPubkey,
      contributionId,
    });

    // Navigate to messages with context
    const params = new URLSearchParams({
      recipient: contributorPubkey,
      context: `contribution:${contributionId}`,
      contextTitle: contributionTitle || 'Contribution',
      ...(contributionImageUrl && { contextImage: contributionImageUrl }),
    });

    router.push(`/messages?${params.toString()}`);
  };

  const actions = useMemo(() => {
    const filtered = detail.actions.filter(action => 
      action.id !== 'report' && 
      action.id !== 'share' &&
      action.id !== 'contact-author'
    );
    return filtered;
  }, [detail.actions]);

  const shareAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'share');
  }, [detail.actions]);

  const contactAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'contact-author');
  }, [detail.actions]);

  // All contribution metadata in a single comprehensive grid
  const allMetadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];

    if (detail.customFields.contributionType) {
      items.push({
        label: 'Contribution Type',
        value: String(detail.customFields.contributionType),
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

    if (detail.customFields.language) {
      items.push({
        label: 'Language',
        value: String(detail.customFields.language),
      });
    }

    if (detail.customFields.location) {
      items.push({
        label: 'Location',
        value: String(detail.customFields.location),
      });
    }

    return items;
  }, [detail.customFields]);

  const tags = useMemo(() => {
    return (detail.tags ?? []).filter(tag => tag.toLowerCase() !== 'nostr-for-nomads-contribution');
  }, [detail.tags]);

  return (
    <div className="space-y-10">
      <ContentDetailHeader
        title={detail.title}
        actions={actions}
        backHref={backHref}
        backLabel="Back to explore"
        customButtons={
          <>
            <button
              type="button"
              onClick={() => setIsLiked(!isLiked)}
              className={`btn-outline-sm inline-flex items-center justify-center ${
                isLiked ? '!border-red-300 !bg-red-50 !text-red-700 hover:!bg-red-100' : ''
              }`}
              aria-label={isLiked ? 'Unlike contribution' : 'Like contribution'}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            
            <button
              type="button"
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`btn-outline-sm inline-flex items-center justify-center ${
                isBookmarked ? '!border-purple-300 !bg-purple-50 !text-purple-700 hover:!bg-purple-100' : ''
              }`}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark contribution'}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-purple-500 text-purple-500' : ''}`} />
            </button>
            
            {shareAction && (
              <button
                type="button"
                onClick={shareAction.onClick}
                className="btn-outline-sm inline-flex items-center justify-center"
                aria-label="Share contribution"
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
            aria-labelledby="contribution-details"
            className="space-y-5 rounded-2xl bg-white/80 p-6 shadow-sm ring-1 ring-primary-100"
          >
            <h2
              id="contribution-details"
              className="text-sm font-semibold uppercase tracking-wide text-gray-500"
            >
              Contribution Details
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
                onClick={handleContactContributor}
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
            title="About this contribution"
            description={detail.description}
            tags={tags}
          />
        }
      />
    </div>
  );
}
