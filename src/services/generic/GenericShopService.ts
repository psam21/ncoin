import { logger } from '../core/LoggingService';
import { queryEvents } from './GenericRelayService';
import { nostrEventService } from '../nostr/NostrEventService';
import type { NostrEvent, NIP23Event } from '@/types/nostr';
import type { ProductEvent } from '@/types/shop';

// Export media attachment interface for use in other services
export interface MediaAttachment {
  url: string;
  mimeType?: string;
  hash?: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

interface ParsedMedia {
  url: string;
  mimeType?: string;
  hash?: string;
  size?: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

/**
 * Parse imeta tag (NIP-94) to extract media metadata
 * Supports: url, mime type (m), hash (x), size, dimensions (dim)
 * @param imetaTag - Imeta tag array from Nostr event
 * @returns Parsed media object with comprehensive metadata or null
 */
export function parseImetaTag(imetaTag: string[]): ParsedMedia | null {
  if (!imetaTag || imetaTag[0] !== 'imeta') return null;
  
  const imetaStr = imetaTag.slice(1).join(' ');
  
  // Try parsing as JSON first (backward compatibility with old format)
  if (imetaStr.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(imetaStr);
      if (!parsed.url) return null;
      
      return {
        url: parsed.url,
        mimeType: parsed.m,
        hash: parsed.x,
        size: parsed.size,
        dimensions: parsed.dim ? (() => {
          const match = parsed.dim.match(/(\d+)x(\d+)/);
          return match ? { width: parseInt(match[1], 10), height: parseInt(match[2], 10) } : undefined;
        })() : undefined,
      };
    } catch {
      // If JSON parsing fails, fall through to space-separated format
    }
  }
  
  // Parse NIP-94 space-separated format (correct format)
  // Extract URL (required)
  const urlMatch = imetaStr.match(/url\s+(\S+)/);
  if (!urlMatch) return null;
  
  const url = urlMatch[1];
  
  // Extract mime type
  const mimeMatch = imetaStr.match(/m\s+(\S+)/);
  const mimeType = mimeMatch ? mimeMatch[1] : undefined;
  
  // Extract hash (x field in NIP-94)
  const hashMatch = imetaStr.match(/x\s+(\S+)/);
  const hash = hashMatch ? hashMatch[1] : undefined;
  
  // Extract size (in bytes)
  const sizeMatch = imetaStr.match(/size\s+(\d+)/);
  const size = sizeMatch ? parseInt(sizeMatch[1], 10) : undefined;
  
  // Extract dimensions (dim field: WxH format)
  const dimMatch = imetaStr.match(/dim\s+(\d+)x(\d+)/);
  const dimensions = dimMatch ? {
    width: parseInt(dimMatch[1], 10),
    height: parseInt(dimMatch[2], 10),
  } : undefined;
  
  return { url, mimeType, hash, size, dimensions };
}

/**
 * Extract media from event tags
 * Supports both imeta tags (NIP-94) and simple media tags
 * @param tags - Event tags array
 * @returns Object with categorized media arrays
 */
export function extractMedia(tags: string[][]): {
  images: MediaAttachment[];
  audio: MediaAttachment[];
  videos: MediaAttachment[];
} {
  const images: MediaAttachment[] = [];
  const audio: MediaAttachment[] = [];
  const videos: MediaAttachment[] = [];
  
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
  
  // Second pass: process tags, skipping simple tags that have imeta equivalents
  tags.forEach(tag => {
    // Check for imeta tags (full metadata)
    if (tag[0] === 'imeta') {
      const parsed = parseImetaTag(tag);
      if (parsed) {
        const { url, mimeType, hash, size, dimensions } = parsed;
        
        // Categorize by mime type
        if (mimeType?.startsWith('video/')) {
          videos.push({ url, mimeType, hash, size, dimensions });
        } else if (mimeType?.startsWith('audio/')) {
          audio.push({ url, mimeType, hash, size });
        } else {
          images.push({ url, mimeType, hash, size, dimensions });
        }
      }
    }
    // Fallback to simple tags ONLY if no imeta exists for this URL
    else if (tag[0] === 'image' && tag[1] && !imetaUrls.has(tag[1])) {
      images.push({ url: tag[1] });
    } else if (tag[0] === 'video' && tag[1] && !imetaUrls.has(tag[1])) {
      videos.push({ url: tag[1] });
    } else if (tag[0] === 'audio' && tag[1] && !imetaUrls.has(tag[1])) {
      audio.push({ url: tag[1] });
    }
  });
  
  return { images, audio, videos };
}

/**
 * Parse a Nostr event into a ProductEvent
 * @param event - Raw Nostr event (Kind 30023)
 * @returns ProductEvent or null if parsing fails
 */
function parseProductEvent(event: NostrEvent): ProductEvent | null {
  try {
    const tags = event.tags as string[][];
    
    // Extract required fields
    const dTag = tags.find(t => t[0] === 'd')?.[1];
    const title = tags.find(t => t[0] === 'title')?.[1];
    
    // Skip events missing required fields
    if (!dTag || !title) {
      logger.warn('Product event missing required fields', {
        service: 'GenericShopService',
        method: 'parseProductEvent',
        eventId: event.id,
        hasDTag: !!dTag,
        hasTitle: !!title,
      });
      return null;
    }
    
    // Extract product fields
    const price = parseFloat(tags.find(t => t[0] === 'price')?.[1] || '0');
    const currency = tags.find(t => t[0] === 'currency')?.[1] || 'USD';
    const category = tags.find(t => t[0] === 'category')?.[1] || 'other';
    const condition = tags.find(t => t[0] === 'condition')?.[1] || 'used';
    const location = tags.find(t => t[0] === 'location')?.[1] || '';
    const contact = tags.find(t => t[0] === 'contact')?.[1] || '';
    
    // Extract custom tags (all tags with 't' key except system tag)
    const customTags = tags
      .filter(t => t[0] === 't' && t[1] !== 'nostr-for-nomads-shop')
      .map(t => t[1]);
    
    // Extract media
    const media = extractMedia(tags);
    
    // Parse description from event.content (handles NIP-23 JSON format)
    let description = event.content || title;
    try {
      // Try parsing as NIP-23 event (JSON content)
      const parsedContent = nostrEventService.parseEventContent(event as NIP23Event);
      if (parsedContent?.content) {
        description = parsedContent.content;
      }
    } catch {
      // If parsing fails, use raw content
      description = event.content || title;
    }
    
    const summary = description.substring(0, 200);
    
    return {
      id: event.id,
      dTag,
      pubkey: event.pubkey,
      title,
      summary,
      description,
      price,
      currency,
      category,
      condition,
      location,
      contact,
      tags: customTags,
      media,
      createdAt: event.created_at,
      publishedAt: event.created_at,
    };
  } catch (error) {
    logger.error('Failed to parse product event', error as Error, {
      service: 'GenericShopService',
      method: 'parseProductEvent',
      eventId: event.id,
    });
    return null;
  }
}

/**
 * Fetch public products from relays
 * Protocol layer method for querying marketplace products
 * 
 * @param limit - Maximum number of products to fetch
 * @param until - Optional timestamp for pagination
 * @param onProgress - Optional callback for relay query progress
 * @returns Array of parsed product events
 */
export async function fetchPublicProducts(
  limit = 20,
  until?: number,
  onProgress?: (progress: { step: string; progress: number; message: string }) => void
): Promise<ProductEvent[]> {
  try {
    logger.info('Fetching public products from relays', {
      service: 'GenericShopService',
      method: 'fetchPublicProducts',
      limit,
      until,
    });

    const filter: Record<string, unknown> = {
      kinds: [30023],
      '#t': ['nostr-for-nomads-shop'],
      limit,
    };

    if (until) {
      filter.until = until;
    }

    const queryResult = await queryEvents([filter], onProgress);

    if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
      logger.info('No products found', {
        service: 'GenericShopService',
        method: 'fetchPublicProducts',
        success: queryResult.success,
        eventCount: 0,
      });
      return [];
    }
    
    logger.info('Fetched product events from relays', {
      service: 'GenericShopService',
      method: 'fetchPublicProducts',
      eventCount: queryResult.events.length,
      relayCount: queryResult.relayCount,
    });

    // NIP-33 parameterized replaceable events - deduplicate by dTag, keeping newest
    const eventsByDTag = new Map<string, NostrEvent>();
    
    for (const event of queryResult.events) {
      const dTag = event.tags.find(t => t[0] === 'd')?.[1];
      if (!dTag) continue;
      
      // Keep the event with the latest created_at timestamp for each dTag
      const existing = eventsByDTag.get(dTag);
      if (!existing || event.created_at > existing.created_at) {
        eventsByDTag.set(dTag, event);
      }
    }

    // Parse and filter valid events
    const products: ProductEvent[] = [];

    for (const event of eventsByDTag.values()) {
      const parsed = parseProductEvent(event);
      if (parsed) {
        products.push(parsed);
      }
    }

    // Sort by created_at DESC (newest first)
    products.sort((a, b) => b.createdAt - a.createdAt);

    logger.info('Parsed and deduplicated products', {
      service: 'GenericShopService',
      method: 'fetchPublicProducts',
      parsedCount: products.length,
      uniqueDTags: eventsByDTag.size,
    });

    return products;
  } catch (error) {
    logger.error('Failed to fetch public products', error as Error, {
      service: 'GenericShopService',
      method: 'fetchPublicProducts',
    });
    return [];
  }
}
