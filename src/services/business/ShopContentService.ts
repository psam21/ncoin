import { logger } from '@/services/core/LoggingService';
import { BaseContentProvider } from './BaseContentProvider';
import { queryEvents } from '../generic/GenericRelayService';
import type { ContentDetailResult, ContentMeta } from '@/types/content-detail';
import type { ContentMediaItem } from '@/types/content-media';

/**
 * Custom fields for shop products
 */
export interface ShopCustomFields {
  price: number;
  currency: string;
  category: string;
  condition: string;
  location: string;
  contact: string;
  [key: string]: unknown;
}

/**
 * Service for fetching shop product content details from Nostr relays
 * Extends BaseContentProvider to provide product-specific content fetching
 */
class ShopContentService extends BaseContentProvider<ShopCustomFields> {
  private static instance: ShopContentService;

  private constructor() {
    super();
  }

  public static getInstance(): ShopContentService {
    if (!ShopContentService.instance) {
      ShopContentService.instance = new ShopContentService();
    }
    return ShopContentService.instance;
  }

  protected getServiceName(): string {
    return 'ShopContentService';
  }

  public async getContentDetail(id: string): Promise<ContentDetailResult<ShopCustomFields>> {
    logger.info('Fetching product content detail', {
      service: 'ShopContentService',
      method: 'getContentDetail',
      productId: id,
    });

    try {
      // Query for product event by d-tag
      const filters = [
        {
          kinds: [30023],
          '#d': [id],
          '#t': ['nostr-for-nomads-shop'],
        },
      ];

      logger.info('Querying relays for product', {
        service: 'ShopContentService',
        method: 'getContentDetail',
        filters,
      });

      const queryResult = await queryEvents(filters);

      if (!queryResult.success || !queryResult.events || queryResult.events.length === 0) {
        logger.warn('Product not found', {
          service: 'ShopContentService',
          method: 'getContentDetail',
          productId: id,
        });
        return {
          success: false,
          error: 'Product not found',
          status: 404,
        };
      }

      // Get the most recent event (highest created_at)
      const event = queryResult.events.sort((a, b) => b.created_at - a.created_at)[0];

      // Parse tags
      const tagsMap = new Map(event.tags.map((tag: string[]) => [tag[0], tag[1]]));
      
      const title = tagsMap.get('title') || 'Untitled Product';
      const summary = tagsMap.get('summary') || '';
      const publishedAt = parseInt(tagsMap.get('published_at') || String(event.created_at));
      const priceStr = tagsMap.get('price') || '0';
      const currency = tagsMap.get('currency') || 'USD';
      const category = tagsMap.get('category') || '';
      const condition = tagsMap.get('condition') || 'used';
      const location = tagsMap.get('location') || '';
      const contact = tagsMap.get('contact') || '';

      // Parse price
      let price = 0;
      try {
        price = parseFloat(priceStr);
      } catch (error) {
        logger.warn('Failed to parse price', {
          service: 'ShopContentService',
          method: 'getContentDetail',
          priceStr,
        });
      }

      // Parse description from content
      let description = event.content || '';
      try {
        const parsedContent = JSON.parse(event.content);
        if (parsedContent.content) {
          description = parsedContent.content;
        }
      } catch {
        // If parsing fails, use raw content
        description = event.content || summary;
      }

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

      // Parse general tags (user tags, not system tags)
      const generalTags = event.tags
        .filter((t: string[]) => t[0] === 't' && t[1] !== 'nostr-for-nomads-shop')
        .map((t: string[]) => t[1]);

      // Get author info
      const npub = this.tryGetNpub(event.pubkey);
      const authorDisplayName = await this.tryGetAuthorDisplayName(event.pubkey);

      // Build metadata array
      const meta: ContentMeta[] = [
        { label: 'Price', value: `${price} ${currency}` },
        { label: 'Category', value: category },
        { label: 'Condition', value: condition },
        { label: 'Location', value: location },
      ];

      logger.info('Product content detail fetched successfully', {
        service: 'ShopContentService',
        method: 'getContentDetail',
        productId: id,
        title,
      });

      // Custom fields for product-specific data
      const customFields: ShopCustomFields = {
        price,
        currency,
        category,
        condition,
        location,
        contact,
      };

      return {
        success: true,
        content: {
          id: event.id,
          title,
          description,
          summary: summary || description.substring(0, 200),
          publishedAt,
          updatedAt: event.created_at,
          author: {
            pubkey: event.pubkey,
            npub,
            displayName: authorDisplayName,
          },
          tags: generalTags,
          media,
          contentType: 'shop',
          customFields,
          meta,
          actions: [
            {
              id: 'contact-seller',
              label: 'Contact Seller',
              type: 'primary',
              metadata: {
                sellerPubkey: event.pubkey,
                productId: id,
                productTitle: title,
                productImageUrl: media[0]?.source.url,
                contact,
              },
            },
          ],
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error fetching product';
      logger.error('Failed to fetch product content detail', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ShopContentService',
        method: 'getContentDetail',
        productId: id,
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

export const shopContentService = ShopContentService.getInstance();
