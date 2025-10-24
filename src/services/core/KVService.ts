import { Redis } from '@upstash/redis';
import { logger } from './LoggingService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';

export interface UserEventData {
  npub: string;
  eventId: string;
  eventKind: number;
  createdTimestamp: number;
  processedTimestamp: number;
  processingDuration: number;
  totalRelaysAttempted: number;
  successfulRelays: string[];
  failedRelays: string[];
  failedRelayReasons?: Record<string, string>; // relay URL -> rejection reason
  // Verification tracking - background verification of relay storage
  verifiedRelays?: string[]; // Relays that BOTH accepted AND returned event on query
  silentFailureRelays?: string[]; // Relays that accepted but DON'T return event (silent data loss)
  unverifiedRelays?: string[]; // Relays not yet verified (verification in progress or skipped)
  verificationTimestamp?: number; // When verification was completed
  averageResponseTime: number;
  tagsCount: number;
  retryAttempts: number;
}

export interface PaginatedEventResponse {
  events: UserEventData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class KVService {
  private static instance: KVService;
  private redis: Redis | null = null;
  private isConnected = false;

  private constructor() {
    // Don't initialize connection in constructor for serverless
  }

  private initializeRedis(): void {
    // Return if already initialized
    if (this.redis && this.isConnected) {
      return;
    }

    try {
      // Check for Upstash REST API credentials (Vercel KV or direct Upstash)
      const upstashUrl = process.env.KV_URL || process.env.UPSTASH_REDIS_REST_URL;
      const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      
      logger.info('🔌 Attempting Upstash Redis connection', {
        service: 'KVService',
        method: 'initializeRedis',
        hasKV_URL: !!process.env.KV_URL,
        hasUPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
        hasUPSTASH_REDIS_REST_TOKEN: !!upstashToken,
        usingUrl: upstashUrl ? 'configured' : 'none',
      });
      
      if (!upstashUrl || !upstashToken) {
        logger.error('❌ Upstash Redis credentials not configured - KV service will not be available', new Error('Redis credentials not configured'), {
          service: 'KVService',
          method: 'initializeRedis',
          checkedVars: ['KV_URL', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
          KV_URL: process.env.KV_URL || 'not set',
          UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || 'not set',
          UPSTASH_REDIS_REST_TOKEN: upstashToken ? 'set' : 'not set',
        });
        throw new Error('Redis credentials not configured');
      }

      logger.info('Creating Upstash Redis client', {
        service: 'KVService',
        method: 'initializeRedis',
        url: upstashUrl.substring(0, 30) + '...',
      });

      // Create Upstash Redis client (REST API - no connection needed)
      this.redis = new Redis({
        url: upstashUrl,
        token: upstashToken,
      });
      
      this.isConnected = true;
      
      logger.info('✅ Upstash Redis client initialized successfully', {
        service: 'KVService',
        method: 'initializeRedis',
      });
    } catch (error) {
      this.isConnected = false;
      logger.error('Failed to initialize Upstash Redis', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'KVService',
        method: 'initializeRedis',
      });
      throw error;
    }
  }

  private ensureConnected(): boolean {
    try {
      if (!this.redis || !this.isConnected) {
        this.initializeRedis();
      }
      return this.isConnected && this.redis !== null;
    } catch (error) {
      logger.error('Failed to ensure Redis connection', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'KVService',
        method: 'ensureConnected',
      });
      return false;
    }
  }

  public static getInstance(): KVService {
    if (!KVService.instance) {
      KVService.instance = new KVService();
    }
    return KVService.instance;
  }

  /**
   * Get database size
   */
  public async getDatabaseSize(): Promise<number> {
    if (!this.ensureConnected()) {
      throw new Error('Redis connection not available');
    }
    return await this.redis!.dbsize();
  }

  /**
   * Scan keys by pattern
   */
  public async scanKeys(pattern: string, count: number = 1000): Promise<string[]> {
    if (!this.ensureConnected()) {
      throw new Error('Redis connection not available');
    }

    const keys: string[] = [];
    let cursor: string | number = 0;

    do {
      const scanResult: [string | number, string[]] = await this.redis!.scan(cursor, {
        match: pattern,
        count,
      });

      const [nextCursor, matchedKeys] = scanResult;
      cursor = typeof nextCursor === 'string' ? (nextCursor === '0' ? 0 : nextCursor) : nextCursor;
      keys.push(...matchedKeys);
    } while (cursor !== 0 && cursor !== '0');

    return keys;
  }

  /**
   * Store event analytics data
   */
  public async logEvent(eventData: UserEventData): Promise<void> {
    try {
      if (!(await this.ensureConnected())) {
        throw new Error('Redis connection not available');
      }

      logger.info('Storing event analytics data', {
        service: 'KVService',
        method: 'logEvent',
        eventId: eventData.eventId,
        npub: eventData.npub.substring(0, 12) + '...',
        eventKind: eventData.eventKind,
      });

      // Create structured key: user_events:{npub}:{timestamp}:{eventId}
      const eventKey = `user_events:${eventData.npub}:${eventData.processedTimestamp}:${eventData.eventId}`;
      
      // Store event data
      await this.redis!.set(eventKey, JSON.stringify(eventData));

      // Update user's event index for pagination
      const indexKey = `user_events_index:${eventData.npub}`;
      await this.redis!.zadd(indexKey, { score: eventData.processedTimestamp, member: eventKey });

      // Update global event index for all-events queries
      const globalIndexKey = 'global_events_index';
      await this.redis!.zadd(globalIndexKey, { score: eventData.processedTimestamp, member: eventKey });

      logger.info('Event analytics data stored successfully', {
        service: 'KVService',
        method: 'logEvent',
        eventId: eventData.eventId,
        eventKey,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to store event analytics data', error instanceof Error ? error : new Error(errorMessage), {
        service: 'KVService',
        method: 'logEvent',
        eventId: eventData.eventId,
        error: errorMessage,
      });

      throw new AppError(
        'Failed to store event analytics data',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Retrieve paginated event data for a user
   */
  public async getUserEvents(
    npub: string,
    page: number = 1,
    limit: number = 20,
    eventKind?: number,
    startDate?: number,
    endDate?: number
  ): Promise<PaginatedEventResponse> {
    try {
      if (!(await this.ensureConnected())) {
        throw new Error('Redis connection not available');
      }

      logger.info('Retrieving user events', {
        service: 'KVService',
        method: 'getUserEvents',
        npub: npub.substring(0, 12) + '...',
        page,
        limit,
        eventKind,
        startDate,
        endDate,
      });

      const indexKey = `user_events_index:${npub}`;
      
      // Get total count first
      const totalCount = await this.redis!.zcard(indexKey);
      
      if (totalCount === 0) {
        return {
          events: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Calculate pagination
      const offset = (page - 1) * limit;
      const totalPages = Math.ceil(totalCount / limit);

      // Get event keys in reverse chronological order (newest first)
      const eventKeys = await this.redis!.zrange(indexKey, offset, offset + limit - 1, {
        rev: true, // Reverse order for newest first
      }) as string[];

      // Fetch event data
      const events: UserEventData[] = [];
      
      for (const eventKey of eventKeys) {
        try {
          const eventDataStr = await this.redis!.get(eventKey);
          if (eventDataStr && typeof eventDataStr === 'string') {
            const eventData: UserEventData = JSON.parse(eventDataStr);
            
            // Apply filters if provided
            if (eventKind !== undefined && eventData.eventKind !== eventKind) {
              continue;
            }
            
            if (startDate !== undefined && eventData.processedTimestamp < startDate) {
              continue;
            }
            
            if (endDate !== undefined && eventData.processedTimestamp > endDate) {
              continue;
            }
            
            events.push(eventData);
          }
        } catch (error) {
          logger.warn('Failed to fetch individual event data', {
            service: 'KVService',
            method: 'getUserEvents',
            eventKey,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const result: PaginatedEventResponse = {
        events,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      };

      logger.info('User events retrieved successfully', {
        service: 'KVService',
        method: 'getUserEvents',
        npub: npub.substring(0, 12) + '...',
        eventCount: events.length,
        totalCount,
        page,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve user events', error instanceof Error ? error : new Error(errorMessage), {
        service: 'KVService',
        method: 'getUserEvents',
        npub: npub.substring(0, 12) + '...',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to retrieve user events',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get all events from all users (global dashboard)
   */
  public async getAllEvents(
    page: number = 1,
    limit: number = 20,
    eventKind?: number,
    startDate?: number,
    endDate?: number
  ): Promise<PaginatedEventResponse> {
    try {
      if (!(await this.ensureConnected())) {
        throw new Error('Redis connection not available');
      }

      logger.info('Retrieving all events globally', {
        service: 'KVService',
        method: 'getAllEvents',
        page,
        limit,
        eventKind,
        startDate,
        endDate,
      });

      const globalIndexKey = 'global_events_index';

      // Get total count from the global index
      const totalCount = await this.redis!.zcard(globalIndexKey);

      if (totalCount === 0) {
        return {
          events: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        };
      }

      // Calculate pagination
      const totalPages = Math.ceil(totalCount / limit);
      const offset = (page - 1) * limit;

      logger.info('Fetching events from global index', {
        service: 'KVService',
        method: 'getAllEvents',
        totalCount,
        offset,
        limit,
        endIndex: offset + limit - 1,
      });

      // Get event keys from global index (newest first)
      // Use BYLEX scoring for string members
      const eventKeysRaw = await this.redis!.zrange(globalIndexKey, offset, offset + limit - 1, {
        rev: true,
      });

      logger.info('Raw zrange result', {
        service: 'KVService',
        method: 'getAllEvents',
        resultType: typeof eventKeysRaw,
        isArray: Array.isArray(eventKeysRaw),
        rawResult: eventKeysRaw,
      });

      // DEBUG: Throw error with debug info to see in API response
      if (Array.isArray(eventKeysRaw) && eventKeysRaw.length > 0) {
        const firstItem = eventKeysRaw[0];
        throw new Error(`DEBUG: zrange returned array with ${eventKeysRaw.length} items. First item type: ${typeof firstItem}, value: ${JSON.stringify(firstItem)}, full array: ${JSON.stringify(eventKeysRaw.slice(0, 3))}`);
      } else {
        throw new Error(`DEBUG: zrange returned non-array or empty. Type: ${typeof eventKeysRaw}, isArray: ${Array.isArray(eventKeysRaw)}, value: ${JSON.stringify(eventKeysRaw)}`);
      }

      // Ensure eventKeys is a string array
      const eventKeys: string[] = Array.isArray(eventKeysRaw) 
        ? eventKeysRaw.filter((key): key is string => typeof key === 'string')
        : [];

      logger.info('Retrieved event keys from index', {
        service: 'KVService',
        method: 'getAllEvents',
        keysCount: eventKeys.length,
        keys: eventKeys,
      });

      // Fetch event data
      const events: UserEventData[] = [];
      
      for (const eventKey of eventKeys) {
        try {
          logger.info('Fetching event data', {
            service: 'KVService',
            method: 'getAllEvents',
            eventKey,
            eventKeyType: typeof eventKey,
          });
          
          const eventDataStr = await this.redis!.get(eventKey);
          
          logger.info('Event data retrieved', {
            service: 'KVService',
            method: 'getAllEvents',
            eventKey,
            hasData: !!eventDataStr,
            dataType: typeof eventDataStr,
            dataLength: eventDataStr ? (typeof eventDataStr === 'string' ? eventDataStr.length : 'not a string') : 0,
          });
          
          if (eventDataStr && typeof eventDataStr === 'string') {
            const eventData: UserEventData = JSON.parse(eventDataStr);
            
            // Apply filters if provided
            if (eventKind !== undefined && eventData.eventKind !== eventKind) {
              continue;
            }
            
            if (startDate !== undefined && eventData.processedTimestamp < startDate) {
              continue;
            }
            
            if (endDate !== undefined && eventData.processedTimestamp > endDate) {
              continue;
            }
            
            events.push(eventData);
          } else {
            logger.warn('Event data not string or empty', {
              service: 'KVService',
              method: 'getAllEvents',
              eventKey,
              dataType: typeof eventDataStr,
              data: eventDataStr,
            });
          }
        } catch (error) {
          logger.warn('Failed to fetch individual event data', {
            service: 'KVService',
            method: 'getAllEvents',
            eventKey,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      const result: PaginatedEventResponse = {
        events,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
      };

      logger.info('All events retrieved successfully', {
        service: 'KVService',
        method: 'getAllEvents',
        eventCount: events.length,
        totalCount,
        page,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to retrieve all events', error instanceof Error ? error : new Error(errorMessage), {
        service: 'KVService',
        method: 'getAllEvents',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to retrieve all events',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Get event statistics for a user
   */
  public async getUserEventStats(npub: string): Promise<{
    totalEvents: number;
    eventKinds: Record<number, number>;
    avgProcessingDuration: number;
    avgResponseTime: number;
    totalSuccessfulRelays: number;
    totalFailedRelays: number;
  }> {
    try {
      if (!(await this.ensureConnected())) {
        throw new Error('Redis connection not available');
      }

      const indexKey = `user_events_index:${npub}`;
      const eventKeys = await this.redis!.zrange(indexKey, 0, -1) as string[];
      
      if (eventKeys.length === 0) {
        return {
          totalEvents: 0,
          eventKinds: {},
          avgProcessingDuration: 0,
          avgResponseTime: 0,
          totalSuccessfulRelays: 0,
          totalFailedRelays: 0,
        };
      }

      const stats = {
        totalEvents: eventKeys.length,
        eventKinds: {} as Record<number, number>,
        totalProcessingDuration: 0,
        totalResponseTime: 0,
        totalSuccessfulRelays: 0,
        totalFailedRelays: 0,
      };

      for (const eventKey of eventKeys) {
        try {
          const eventDataStr = await this.redis!.get(eventKey);
          if (eventDataStr && typeof eventDataStr === 'string') {
            const eventData: UserEventData = JSON.parse(eventDataStr);
            
            // Count event kinds
            stats.eventKinds[eventData.eventKind] = (stats.eventKinds[eventData.eventKind] || 0) + 1;
            
            // Accumulate durations and response times
            stats.totalProcessingDuration += eventData.processingDuration;
            stats.totalResponseTime += eventData.averageResponseTime;
            stats.totalSuccessfulRelays += eventData.successfulRelays.length;
            stats.totalFailedRelays += eventData.failedRelays.length;
          }
        } catch (error) {
          logger.warn('Failed to process event for stats', {
            service: 'KVService',
            method: 'getUserEventStats',
            eventKey,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return {
        totalEvents: stats.totalEvents,
        eventKinds: stats.eventKinds,
        avgProcessingDuration: Math.round(stats.totalProcessingDuration / stats.totalEvents),
        avgResponseTime: Math.round(stats.totalResponseTime / stats.totalEvents),
        totalSuccessfulRelays: stats.totalSuccessfulRelays,
        totalFailedRelays: stats.totalFailedRelays,
      };
    } catch (error) {
      logger.error('Failed to calculate user event stats', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'KVService',
        method: 'getUserEventStats',
        npub: npub.substring(0, 12) + '...',
      });
      
      // Return empty stats on error
      return {
        totalEvents: 0,
        eventKinds: {},
        avgProcessingDuration: 0,
        avgResponseTime: 0,
        totalSuccessfulRelays: 0,
        totalFailedRelays: 0,
      };
    }
  }
}

// Export singleton instance
export const kvService = KVService.getInstance();
