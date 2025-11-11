import { logger } from '@/services/core/LoggingService';
import { BaseContentProvider } from './BaseContentProvider';
import { queryEvents } from '../generic/GenericRelayService';
import type { ContributionCustomFields } from '@/types/contributions';
import type { ContentDetailResult, ContentMeta } from '@/types/content-detail';
import type { ContentMediaItem } from '@/types/content-media';

/**
 * Service for fetching contribution content details from Nostr relays
 * Extends BaseContentProvider to provide contribution-specific content fetching
 */
class ContributionContentService extends BaseContentProvider<ContributionCustomFields> {
  private static instance: ContributionContentService;

  private constructor() {
    super();
  }

  public static getInstance(): ContributionContentService {
    if (!ContributionContentService.instance) {
      ContributionContentService.instance = new ContributionContentService();
    }
    return ContributionContentService.instance;
  }

  protected getServiceName(): string {
    return 'ContributionContentService';
  }

  public async getContentDetail(id: string): Promise<ContentDetailResult<ContributionCustomFields>> {
    logger.info('Fetching contribution content detail', {
      service: 'ContributionContentService',
      method: 'getContentDetail',
      contributionId: id,
    });

    try {
      // Query for contribution event by d-tag
      const filters = [
        {
          kinds: [30023],
          '#d': [id],
          '#t': ['nostr-for-nomads-contribution'],
        },
      ];

      logger.info('Querying relays for contribution', {
        service: 'ContributionContentService',
        method: 'getContentDetail',
        filters,
      });

      const queryResult = await queryEvents(filters);

      if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
        logger.warn('Contribution not found', {
          service: 'ContributionContentService',
          method: 'getContentDetail',
          contributionId: id,
        });
        return {
          success: false,
          error: 'Contribution not found',
        };
      }

      // Get the most recent event (highest created_at)
      const event = queryResult.events.sort((a, b) => b.created_at - a.created_at)[0];
      
      logger.info('Contribution event found', {
        service: 'ContributionContentService',
        method: 'getContentDetail',
        eventId: event.id,
        contributionId: id,
      });

      // Parse event tags
      const tagsMap = new Map(event.tags.map((tag: string[]) => [tag[0], tag[1]]));
      
      const title = tagsMap.get('title') || 'Untitled Contribution';
      const summary = tagsMap.get('summary') || '';
      const publishedAt = parseInt(tagsMap.get('published_at') || String(event.created_at));
      const location = tagsMap.get('location') || '';
      const imageUrl = tagsMap.get('image') || '';

      // Parse contribution-specific fields
      const contributionType = tagsMap.get('contribution_type') || '';
      const category = tagsMap.get('category') || '';
      const region = tagsMap.get('region') || '';
      const country = tagsMap.get('country') || '';
      const language = tagsMap.get('language') || 'en';

      // Extract media attachments from imeta tags
      const media: ContentMediaItem[] = [];
      let mediaIndex = 0;

      for (const tag of event.tags as string[][]) {
        if (tag[0] === 'imeta') {
          const metaMap = new Map<string, string>();
          for (let i = 1; i < tag.length; i++) {
            const part = tag[i];
            const spaceIndex = part.indexOf(' ');
            if (spaceIndex > 0) {
              const key = part.substring(0, spaceIndex);
              const value = part.substring(spaceIndex + 1);
              metaMap.set(key, value);
            }
          }

          const url = metaMap.get('url');
          const mimeType = metaMap.get('m');
          if (url) {
            const mediaType: 'image' | 'video' | 'audio' = 
              mimeType?.startsWith('video/') ? 'video' :
              mimeType?.startsWith('audio/') ? 'audio' : 
              'image';

            const dimStr = metaMap.get('dim');
            let dimensions: { width: number; height: number } | undefined;
            if (dimStr) {
              const [width, height] = dimStr.split('x').map(n => parseInt(n));
              if (width && height) {
                dimensions = { width, height };
              }
            }

            media.push({
              id: `media-${mediaIndex++}`,
              source: {
                url,
                mimeType,
                hash: metaMap.get('x'),
                size: metaMap.get('size') ? parseInt(metaMap.get('size')!) : undefined,
                dimensions,
              },
              description: metaMap.get('alt') || '',
              type: mediaType,
            });
          }
        }
      }

      // Get author info
      const npub = this.tryGetNpub(event.pubkey);
      const authorDisplayName = await this.tryGetAuthorDisplayName(event.pubkey);

      // Build metadata display
      const customFields: ContributionCustomFields = {
        contributionType: contributionType || undefined,
        category: category || undefined,
        region: region || undefined,
        country: country || undefined,
        language: language || undefined,
        location: location || undefined,
      };

      const meta: ContentMeta[] = [];
      if (customFields.contributionType) {
        meta.push({ label: 'Contribution Type', value: customFields.contributionType });
      }
      if (customFields.category) {
        meta.push({ label: 'Category', value: customFields.category });
      }
      if (customFields.region) {
        meta.push({ label: 'Region', value: customFields.region });
      }
      if (customFields.country) {
        meta.push({ label: 'Country', value: customFields.country });
      }
      if (customFields.language) {
        meta.push({ label: 'Language', value: customFields.language });
      }
      if (customFields.location) {
        meta.push({ label: 'Location', value: customFields.location });
      }

      // Extract general tags (not system tags)
      const systemTags = new Set([
        'title', 'summary', 'published_at', 'image', 'location',
        'contribution_type', 'category', 'region', 'country', 'language', 'd', 'imeta', 't'
      ]);
      const generalTags = event.tags
        .filter((tag: string[]) => !systemTags.has(tag[0]))
        .map((tag: string[]) => tag[1])
        .filter(Boolean);

      // Parse description - handle both markdown string and JSON object in event.content
      let fullDescription = summary;
      if (event.content) {
        try {
          // Try parsing as JSON first (some events have structured content)
          const parsed = JSON.parse(event.content);
          // If it's an object with description field, use that
          if (parsed && typeof parsed === 'object' && parsed.description) {
            fullDescription = parsed.description;
          } else if (typeof parsed === 'string') {
            fullDescription = parsed;
          }
        } catch {
          // If not JSON, treat as plain markdown text
          fullDescription = event.content;
        }
      }

      return {
        success: true,
        content: {
          id,
          dTag: id,
          title,
          description: fullDescription,
          summary: summary || fullDescription.slice(0, 200) + '...',
          publishedAt,
          author: {
            pubkey: event.pubkey,
            npub,
            displayName: authorDisplayName,
          },
          tags: generalTags,
          media,
          contentType: 'contribute',
          customFields,
          meta,
          actions: [
            {
              id: 'contact-author',
              label: 'Contact Contributor',
              type: 'primary',
              metadata: {
                contributorPubkey: event.pubkey,
                contributionId: id,
                contributionTitle: title,
                contributionImageUrl: imageUrl || media[0]?.source.url,
              },
            },
          ],
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching contribution';
      logger.error('Error fetching contribution content', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ContributionContentService',
        method: 'getContentDetail',
        contributionId: id,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const contributionContentService = ContributionContentService.getInstance();
