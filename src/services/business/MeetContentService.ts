import { logger } from '@/services/core/LoggingService';
import { BaseContentProvider } from './BaseContentProvider';
import { queryEvents } from '../generic/GenericRelayService';
import type { ContentDetailResult, ContentMeta } from '@/types/content-detail';
import type { ContentMediaItem } from '@/types/content-media';

/**
 * Custom fields for meetup events
 */
export interface MeetCustomFields {
  startTime: number;
  endTime?: number;
  timezone?: string;
  location:  string;
  geohash?: string;
  isVirtual: boolean;
  virtualLink?: string;
  meetupType: string;
  hostPubkey: string;
  coHosts?: string[];
  [key: string]: unknown;
}

/**
 * Service for fetching meetup content details from Nostr relays
 * Extends BaseContentProvider to provide meetup-specific content fetching
 */
class MeetContentService extends BaseContentProvider<MeetCustomFields> {
  private static instance: MeetContentService;

  private constructor() {
    super();
  }

  public static getInstance(): MeetContentService {
    if (!MeetContentService.instance) {
      MeetContentService.instance = new MeetContentService();
    }
    return MeetContentService.instance;
  }

  protected getServiceName(): string {
    return 'MeetContentService';
  }

  public async getContentDetail(id: string): Promise<ContentDetailResult<MeetCustomFields>> {
    logger.info('Fetching meetup content detail', {
      service: 'MeetContentService',
      method: 'getContentDetail',
      meetupId: id,
    });

    try {
      // Query for meetup event by d-tag (Kind 31923 - Calendar Event)
      const filters = [
        {
          kinds: [31923],
          '#d': [id],
        },
      ];

      logger.info('Querying relays for meetup', {
        service: 'MeetContentService',
        method: 'getContentDetail',
        filters,
      });

      const queryResult = await queryEvents(filters);

      if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
        logger.warn('Meetup not found', {
          service: 'MeetContentService',
          method: 'getContentDetail',
          meetupId: id,
        });
        return {
          success: false,
          error: 'Meetup not found',
          status: 404,
        };
      }

      // Get the most recent event (highest created_at)
      const event = queryResult.events.sort((a, b) => b.created_at - a.created_at)[0];

      // Parse tags
      const tagsMap = new Map(event.tags.map((tag: string[]) => [tag[0], tag[1]]));
      
      const name = tagsMap.get('name') || tagsMap.get('title') || 'Untitled Meetup';
      const startTimeStr = tagsMap.get('start') || String(event.created_at);
      const endTimeStr = tagsMap.get('end');
      const timezone = tagsMap.get('timezone');
      const location = tagsMap.get('location') || '';
      const geohash = tagsMap.get('g');
      const virtualLink = tagsMap.get('virtual');
      const meetupType = tagsMap.get('meetup-type') || 'other';
      const hostPubkey = tagsMap.get('p') || event.pubkey;

      const startTime = parseInt(startTimeStr, 10);
      const endTime = endTimeStr ? parseInt(endTimeStr, 10) : undefined;
      const isVirtual = !!virtualLink;

      // Parse description from content
      const description = event.content || '';

      // Parse media from imeta tags (NIP-94)
      const media: ContentMediaItem[] = [];
      for (const tag of event.tags) {
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
          if (url) {
            const mimeType = metaMap.get('m') || 'image/jpeg';
            const hash = metaMap.get('x');
            const sizeStr = metaMap.get('size');
            const size = sizeStr ? parseInt(sizeStr, 10) : undefined;

            let mediaType: 'image' | 'video' | 'audio' = 'image';
            if (mimeType.startsWith('video/')) mediaType = 'video';
            else if (mimeType.startsWith('audio/')) mediaType = 'audio';

            media.push({
              id: `${hash || url}-${Date.now()}`,
              type: mediaType,
              source: { url, mimeType, hash, size },
            });
          }
        }
      }

      // Backward compatibility: Check for legacy 'image' tag if no imeta tags found
      if (media.length === 0) {
        const legacyImageUrl = tagsMap.get('image');
        if (legacyImageUrl) {
          media.push({
            id: `legacy-${legacyImageUrl}-${Date.now()}`,
            type: 'image',
            source: { url: legacyImageUrl, mimeType: 'image/jpeg' },
          });
        }
      }

      // Parse general tags (user tags, not system tags)
      const generalTags = event.tags
        .filter((t: string[]) => t[0] === 't' && t[1] !== 'nostr-for-nomads-meetup')
        .map((t: string[]) => t[1]);

      // Parse co-hosts (additional p-tags with role)
      const coHosts: string[] = [];
      for (const tag of event.tags) {
        if (tag[0] === 'p' && tag[1] !== hostPubkey && tag.length > 2 && tag[2] === 'co-host') {
          coHosts.push(tag[1]);
        }
      }

      // Get author info
      const npub = this.tryGetNpub(event.pubkey);
      const authorDisplayName = await this.tryGetAuthorDisplayName(event.pubkey);

      // Format date for metadata
      const date = new Date(startTime * 1000);
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone || 'UTC',
      });

      // Build metadata array
      const meta: ContentMeta[] = [
        { label: 'Date', value: formattedDate },
        { label: 'Location', value: isVirtual ? 'Virtual' : location },
        { label: 'Type', value: meetupType },
        ...(timezone ? [{ label: 'Timezone', value: timezone }] : []),
      ];

      logger.info('Meetup content detail fetched successfully', {
        service: 'MeetContentService',
        method: 'getContentDetail',
        meetupId: id,
        name,
      });

      // Custom fields for meetup-specific data
      const customFields: MeetCustomFields = {
        startTime,
        endTime,
        timezone,
        location,
        geohash,
        isVirtual,
        virtualLink,
        meetupType,
        hostPubkey,
        coHosts: coHosts.length > 0 ? coHosts : undefined,
      };

      return {
        success: true,
        content: {
          id: event.id,
          title: name,
          description,
          summary: description.substring(0, 200),
          publishedAt: startTime,
          updatedAt: event.created_at,
          author: {
            pubkey: event.pubkey,
            npub,
            displayName: authorDisplayName,
          },
          tags: generalTags,
          media,
          contentType: 'meet',
          customFields,
          meta,
          actions: [
            {
              id: 'rsvp',
              label: 'RSVP',
              type: 'primary',
              metadata: {
                meetupId: id,
                meetupPubkey: event.pubkey,
                meetupTitle: name,
                startTime,
              },
            },
            {
              id: 'contact-host',
              label: 'Contact Host',
              type: 'secondary',
              metadata: {
                hostPubkey,
                meetupId: id,
                meetupTitle: name,
              },
            },
          ],
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching meetup';
      logger.error('Failed to fetch meetup content detail', error instanceof Error ? error : new Error(errorMessage), {
        service: 'MeetContentService',
        method: 'getContentDetail',
        meetupId: id,
        error: errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
        status: 500,
      };
    }
  }
}

export const meetContentService = MeetContentService.getInstance();
