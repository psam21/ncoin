/**
 * Event Logging Service
 * Handles logging of Nostr event publishing analytics to the user activity log
 */
import { logger } from './LoggingService';
import { RelayPublishingResult } from '../generic/GenericRelayService';
import { NostrEvent } from '../../types/nostr';

export class EventLoggingService {
  private static instance: EventLoggingService;

  private constructor() {}

  public static getInstance(): EventLoggingService {
    if (!EventLoggingService.instance) {
      EventLoggingService.instance = new EventLoggingService();
    }
    return EventLoggingService.instance;
  }

  /**
   * Log event publishing analytics to the user activity log
   * Failures are logged but do NOT throw - telemetry never blocks main flow
   */
  public async logEventPublishing(
    event: NostrEvent,
    publishResult: RelayPublishingResult
  ): Promise<void> {
    try {
      // Only log if we have the required analytics data
      if (!publishResult.npub || !publishResult.processedTimestamp || !publishResult.processingDuration) {
        logger.warn('Skipping event logging - missing analytics data', {
          service: 'EventLoggingService',
          method: 'logEventPublishing',
          eventId: event.id,
          hasNpub: !!publishResult.npub,
          hasProcessedTimestamp: !!publishResult.processedTimestamp,
          hasProcessingDuration: !!publishResult.processingDuration,
        });
        return;
      }

      const eventData = {
        npub: publishResult.npub,
        eventId: event.id,
        eventKind: event.kind,
        createdTimestamp: event.created_at * 1000, // Convert to milliseconds
        processedTimestamp: publishResult.processedTimestamp,
        processingDuration: publishResult.processingDuration,
        totalRelaysAttempted: publishResult.totalRelays,
        successfulRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
        failedRelayReasons: publishResult.failedRelayReasons,
        // Verification data (may be undefined initially, populated later)
        verifiedRelays: publishResult.verifiedRelays || [],
        silentFailureRelays: publishResult.silentFailureRelays || [],
        unverifiedRelays: publishResult.unverifiedRelays || [],
        verificationTimestamp: publishResult.verificationTimestamp,
        averageResponseTime: publishResult.averageResponseTime || 0,
        tagsCount: event.tags.length,
        retryAttempts: publishResult.retryAttempts || 0,
      };

      logger.info('Logging event publishing analytics', {
        service: 'EventLoggingService',
        method: 'logEventPublishing',
        eventId: event.id,
        eventKind: event.kind,
        npub: publishResult.npub.substring(0, 12) + '...',
        successfulRelays: publishResult.publishedRelays.length,
        failedRelays: publishResult.failedRelays.length,
        processingDuration: publishResult.processingDuration,
      });

      // Send to logging API with timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout
      
      try {
        const response = await fetch('/api/log-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        const result = await response.json();

        if (!response.ok || !result.success) {
          // Log but don't throw
          logger.warn('Event logging API returned error', {
            service: 'EventLoggingService',
            method: 'logEventPublishing',
            eventId: event.id,
            status: response.status,
            error: result.error || 'Unknown error',
          });
          return;
        }

        logger.info('Event analytics logged successfully', {
          service: 'EventLoggingService',
          method: 'logEventPublishing',
          eventId: event.id,
          loggedEventId: result.eventId,
        });

      } catch (fetchError) {
        clearTimeout(timeout);
        // Network or timeout error - log at info level, don't throw
        const reason = fetchError instanceof Error && fetchError.name === 'AbortError' 
          ? 'Timeout' 
          : (fetchError instanceof Error ? fetchError.message : 'Network error');
        logger.info('Event logging request failed (non-blocking)', {
          service: 'EventLoggingService',
          method: 'logEventPublishing',
          eventId: event.id,
          reason,
        });
      }

    } catch (error) {
      // Catch-all: log but don't throw - telemetry must never block
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.warn('Event logging encountered error (non-blocking)', {
        service: 'EventLoggingService',
        method: 'logEventPublishing',
        error: errorMessage,
      });
    }
  }

  /**
   * Log event publishing analytics in the background (fire-and-forget)
   */
  public logEventPublishingAsync(
    event: NostrEvent,
    publishResult: RelayPublishingResult
  ): void {
    // Use setTimeout to make it truly async and non-blocking
    setTimeout(() => {
      this.logEventPublishing(event, publishResult);
    }, 0);
  }
}

// Export singleton instance
export const eventLoggingService = EventLoggingService.getInstance();
