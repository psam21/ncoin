
import { logger } from '../core/LoggingService';
import { queryEvents } from './GenericRelayService';
import type { NostrEvent } from '@/types/nostr';

export interface ContributionEvent {
  id: string;
  dTag: string;
  pubkey: string;
  title: string;
  summary: string;
  category: string;
  contributionType: string;
  location: string;
  region: string;
  country?: string;
  tags: string[];
  media: {
    images: string[];
    audio: string[];
    videos: string[];
  };
  createdAt: number;
  publishedAt: number;
}

function parseImetaTag(imetaTag: string[]): { url: string; mimeType?: string } | null {
  if (!imetaTag || imetaTag[0] !== 'imeta') return null;
  
  const imetaStr = imetaTag.slice(1).join(' ');
  
  // Extract URL
  const urlMatch = imetaStr.match(/url\s+(\S+)/);
  if (!urlMatch) return null;
  
  const url = urlMatch[1];
  
  // Extract mime type
  const mimeMatch = imetaStr.match(/m\s+(\S+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : undefined;
  
  return { url, mimeType };
}

function extractMedia(tags: string[][]): {
  images: string[];
  audio: string[];
  videos: string[];
} {
  const images: string[] = [];
  const audio: string[] = [];
  const videos: string[] = [];
  
  tags.forEach(tag => {
    // Check for imeta tags (full metadata)
    if (tag[0] === 'imeta') {
      const parsed = parseImetaTag(tag);
      if (parsed) {
        const { url, mimeType } = parsed;
        
        // Categorize by mime type
        if (mimeType?.startsWith('video/')) {
          videos.push(url);
        } else if (mimeType?.startsWith('audio/')) {
          audio.push(url);
        } else {
          images.push(url);
        }
      }
    }
    // Fallback to simple tags
    else if (tag[0] === 'image' && tag[1]) {
      images.push(tag[1]);
    } else if (tag[0] === 'video' && tag[1]) {
      videos.push(tag[1]);
    } else if (tag[0] === 'audio' && tag[1]) {
      audio.push(tag[1]);
    }
  });
  
  return { images, audio, videos };
}

function parseContributionEvent(event: NostrEvent): ContributionEvent | null {
  try {
    const tags = event.tags as string[][];
    
    // Extract required fields
    const dTag = tags.find(t => t[0] === 'd')?.[1];
    const title = tags.find(t => t[0] === 'title')?.[1];
    const summary = tags.find(t => t[0] === 'summary')?.[1];
    
    // Skip events missing required fields
    if (!dTag || !title) {
      logger.warn('Contribution event missing required fields', {
        service: 'GenericContributionService',
        method: 'parseContributionEvent',
        eventId: event.id,
        hasDTag: !!dTag,
        hasTitle: !!title,
      });
      return null;
    }
    
    // Extract optional fields
    const category = tags.find(t => t[0] === 'category')?.[1] || 'Uncategorized';
    const contributionType = tags.find(t => t[0] === 'contribution-type')?.[1] || '';
    const location = tags.find(t => t[0] === 'location')?.[1] || '';
    const region = tags.find(t => t[0] === 'region')?.[1] || '';
    const country = tags.find(t => t[0] === 'country')?.[1];
    
    // Extract custom tags (all tags with 't' key except system tags)
    const customTags = tags
      .filter(t => t[0] === 't' && !t[1].startsWith('nostr-for-nomads-'))
      .map(t => t[1]);
    
    // Extract media
    const media = extractMedia(tags);
    
    return {
      id: event.id,
      dTag,
      pubkey: event.pubkey,
      title,
      summary: summary || title, // Fallback to title if no summary
      category,
      contributionType,
      location,
      region,
      country,
      tags: customTags,
      media,
      createdAt: event.created_at,
      publishedAt: event.created_at,
    };
  } catch (error) {
    logger.error('Error parsing contribution event', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericContributionService',
      method: 'parseContributionEvent',
      eventId: event.id,
    });
    return null;
  }
}

export async function fetchPublicContributions(
  limit = 8,
  until?: number
): Promise<ContributionEvent[]> {
  try {
    logger.info('Fetching public nomad contributions', {
      service: 'GenericContributionService',
      method: 'fetchPublicContributions',
      limit,
      until,
      hasPagination: !!until,
    });

    // Build relay filter
    const filter: Record<string, unknown> = {
      kinds: [30023],
      '#t': ['nostr-for-nomads-contribution'], // Must match tag used in event creation
      limit,
    };
    
    // Add pagination filter if provided
    if (until) {
      filter.until = until;
    }

    // Query relays
    const queryResult = await queryEvents([filter]);

    if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
      logger.info('No nomad contributions found', {
        service: 'GenericContributionService',
        method: 'fetchPublicContributions',
        success: queryResult.success,
        eventCount: 0,
      });
      return [];
    }

    logger.info('Found contribution events from relays', {
      service: 'GenericContributionService',
      method: 'fetchPublicContributions',
      eventCount: queryResult.events.length,
      relayCount: queryResult.relayCount,
    });

    // Parse events
    const contributionEvents: ContributionEvent[] = [];
    const seenDTags = new Set<string>(); // Deduplication by dTag

    for (const event of queryResult.events) {
      const parsed = parseContributionEvent(event);
      
      if (parsed && !seenDTags.has(parsed.dTag)) {
        seenDTags.add(parsed.dTag);
        contributionEvents.push(parsed);
      }
    }

    // Sort by created_at DESC (newest first)
    contributionEvents.sort((a, b) => b.createdAt - a.createdAt);

    logger.info('Nomad contributions parsed successfully', {
      service: 'GenericContributionService',
      method: 'fetchPublicContributions',
      parsedCount: contributionEvents.length,
      deduplicatedCount: queryResult.events.length - contributionEvents.length,
    });

    return contributionEvents;
  } catch (error) {
    logger.error('Error fetching public contributions', error instanceof Error ? error : new Error('Unknown error'), {
      service: 'GenericContributionService',
      method: 'fetchPublicContributions',
      limit,
      until,
    });
    return [];
  }
}

export const GenericContributionService = {
  fetchPublicContributions,
};
