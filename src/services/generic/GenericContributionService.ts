
import { logger } from '../core/LoggingService';
import { queryEvents } from './GenericRelayService';
import type { NostrEvent } from '@/types/nostr';

// Export media attachment interface for use in other services
export interface MediaAttachment {
  url: string;
  mimeType?: string;
  hash?: string;
  size?: number;
}

export interface ContributionEvent {
  id: string;
  dTag: string;
  pubkey: string;
  title: string;
  summary: string;
  description: string; // Full content from event.content field
  category: string;
  contributionType: string;
  language: string; // Language tag from event
  location: string;
  region: string;
  country?: string;
  tags: string[];
  media: {
    images: MediaAttachment[];
    audio: MediaAttachment[];
    videos: MediaAttachment[];
  };
  createdAt: number;
  publishedAt: number;
}

interface ParsedMedia {
  url: string;
  mimeType?: string;
  hash?: string;
  size?: number;
}

// Export parsing function for use in other services
export function parseImetaTag(imetaTag: string[]): ParsedMedia | null {
  if (!imetaTag || imetaTag[0] !== 'imeta') return null;
  
  const imetaStr = imetaTag.slice(1).join(' ');
  
  // Extract URL
  const urlMatch = imetaStr.match(/url\s+(\S+)/);
  if (!urlMatch) return null;
  
  const url = urlMatch[1];
  
  // Extract mime type
  const mimeMatch = imetaStr.match(/m\s+(\S+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : undefined;
  
  // Extract hash (x field in NIP-94)
  const hashMatch = imetaStr.match(/x\s+(\S+)/);
  const hash = hashMatch ? hashMatch[1] : undefined;
  
  // Extract size
  const sizeMatch = imetaStr.match(/size\s+(\d+)/);
  const size = sizeMatch ? parseInt(sizeMatch[1], 10) : undefined;
  
  return { url, mimeType, hash, size };
}

// Export media extraction function for use in other services
export function extractMedia(tags: string[][]): {
  images: MediaAttachment[];
  audio: MediaAttachment[];
  videos: MediaAttachment[];
} {
  const images: MediaAttachment[] = [];
  const audio: MediaAttachment[] = [];
  const videos: MediaAttachment[] = [];
  
  console.log('[GenericContributionService] extractMedia - total tags:', tags.length);
  
  // First pass: collect all URLs from imeta tags to avoid duplicates
  const imetaUrls = new Set<string>();
  tags.forEach(tag => {
    if (tag[0] === 'imeta') {
      const parsed = parseImetaTag(tag);
      if (parsed?.url) {
        imetaUrls.add(parsed.url);
      }
    }
  });
  
  console.log('[GenericContributionService] Found imeta URLs:', imetaUrls.size);
  
  // Second pass: process tags, skipping simple tags that have imeta equivalents
  tags.forEach(tag => {
    // Check for imeta tags (full metadata)
    if (tag[0] === 'imeta') {
      console.log('[GenericContributionService] Found imeta tag:', tag);
      const parsed = parseImetaTag(tag);
      if (parsed) {
        const { url, mimeType, hash, size } = parsed;
        console.log('[GenericContributionService] Parsed imeta:', { url, mimeType, hash, size });
        
        // Categorize by mime type
        if (mimeType?.startsWith('video/')) {
          videos.push({ url, mimeType, hash, size });
        } else if (mimeType?.startsWith('audio/')) {
          audio.push({ url, mimeType, hash, size });
        } else {
          images.push({ url, mimeType, hash, size });
        }
      } else {
        console.log('[GenericContributionService] Failed to parse imeta tag');
      }
    }
    // Fallback to simple tags ONLY if no imeta exists for this URL
    else if (tag[0] === 'image' && tag[1] && !imetaUrls.has(tag[1])) {
      console.log('[GenericContributionService] Found simple image tag (no imeta):', tag[1]);
      images.push({ url: tag[1] });
    } else if (tag[0] === 'video' && tag[1] && !imetaUrls.has(tag[1])) {
      console.log('[GenericContributionService] Found simple video tag (no imeta):', tag[1]);
      videos.push({ url: tag[1] });
    } else if (tag[0] === 'audio' && tag[1] && !imetaUrls.has(tag[1])) {
      console.log('[GenericContributionService] Found simple audio tag (no imeta):', tag[1]);
      audio.push({ url: tag[1] });
    }
  });
  
  console.log('[GenericContributionService] extractMedia result:', {
    imagesCount: images.length,
    audiosCount: audio.length,
    videosCount: videos.length,
    total: images.length + audio.length + videos.length
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
    const language = tags.find(t => t[0] === 'language')?.[1] || 'en';
    const location = tags.find(t => t[0] === 'location')?.[1] || '';
    const region = tags.find(t => t[0] === 'region')?.[1] || '';
    const country = tags.find(t => t[0] === 'country')?.[1];
    
    // Extract custom tags (all tags with 't' key except system tags)
    const customTags = tags
      .filter(t => t[0] === 't' && !t[1].startsWith('nostr-for-nomads-'))
      .map(t => t[1]);
    
    // Extract media
    const media = extractMedia(tags);
    
    // Parse description from event.content (NIP-23 long-form content)
    let description = '';
    try {
      const nip23Content = JSON.parse(event.content);
      description = nip23Content.content || event.content || summary || title;
    } catch {
      // Fallback to raw content if not valid JSON
      description = event.content || summary || title;
    }
    
    return {
      id: event.id,
      dTag,
      pubkey: event.pubkey,
      title,
      summary: summary || title, // Fallback to title if no summary
      description,
      category,
      contributionType,
      language,
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

    // NIP-33 parameterized replaceable events - deduplicate by dTag, keeping newest
    // Some relays may return multiple versions temporarily, so we dedupe client-side
    const eventsByDTag = new Map<string, NostrEvent>();
    
    for (const event of queryResult.events) {
      const dTag = event.tags.find(t => t[0] === 'd')?.[1];
      if (!dTag) continue; // Skip events without dTag
      
      // Keep the event with the latest created_at timestamp for each dTag
      const existing = eventsByDTag.get(dTag);
      if (!existing || event.created_at > existing.created_at) {
        eventsByDTag.set(dTag, event);
      }
    }

    logger.info('Deduplicated contributions by dTag', {
      service: 'GenericContributionService',
      method: 'fetchPublicContributions',
      originalCount: queryResult.events.length,
      deduplicatedCount: eventsByDTag.size,
    });

    // Parse deduplicated events
    const contributionEvents: ContributionEvent[] = [];

    for (const event of eventsByDTag.values()) {
      const parsed = parseContributionEvent(event);
      if (parsed) {
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
