import { logger } from '@/services/core/LoggingService';
import type { MeetupData, MeetupValidationResult } from '@/types/meetup';
import { MEETUP_CONFIG } from '@/config/meetup';

/**
 * Business service for meetup data validation
 * Validates against business rules for calendar events
 */
export class MeetValidationService {
  /**
   * Validate meetup data against business rules
   * 
   * @param data - Partial meetup data to validate
   * @returns Validation result with errors keyed by field name
   */
  static validateMeetupData(
    data: Partial<MeetupData>
  ): MeetupValidationResult {
    const errors: MeetupValidationResult['errors'] = {};
    const now = Math.floor(Date.now() / 1000);

    // Name validation (3-100 characters)
    if (!data.name || data.name.trim().length < MEETUP_CONFIG.validation.name.minLength) {
      errors.name = `Name must be at least ${MEETUP_CONFIG.validation.name.minLength} characters`;
    } else if (data.name.trim().length > MEETUP_CONFIG.validation.name.maxLength) {
      errors.name = `Name must be less than ${MEETUP_CONFIG.validation.name.maxLength} characters`;
    }

    // Description validation (10-5000 characters)
    if (!data.description || data.description.trim().length < MEETUP_CONFIG.validation.description.minLength) {
      errors.description = `Description must be at least ${MEETUP_CONFIG.validation.description.minLength} characters`;
    } else if (data.description.trim().length > MEETUP_CONFIG.validation.description.maxLength) {
      errors.description = `Description must be less than ${MEETUP_CONFIG.validation.description.maxLength} characters`;
    }

    // Start time validation (must be in future for new meetups)
    if (!data.startTime) {
      errors.startTime = 'Start time is required';
    } else if (typeof data.startTime !== 'number') {
      errors.startTime = 'Start time must be a valid timestamp';
    } else if (data.startTime < now) {
      errors.startTime = 'Start time must be in the future';
    } else if (data.startTime > now + MEETUP_CONFIG.time.maxFutureTime) {
      errors.startTime = 'Start time cannot be more than 1 year in the future';
    }

    // End time validation (must be after start time)
    if (data.endTime !== undefined && data.endTime !== null) {
      if (typeof data.endTime !== 'number') {
        errors.endTime = 'End time must be a valid timestamp';
      } else if (data.startTime && data.endTime <= data.startTime) {
        errors.endTime = 'End time must be after start time';
      }
    }

    // Location validation (3-200 characters)
    if (!data.location || data.location.trim().length < MEETUP_CONFIG.validation.location.minLength) {
      errors.location = `Location must be at least ${MEETUP_CONFIG.validation.location.minLength} characters`;
    } else if (data.location.trim().length > MEETUP_CONFIG.validation.location.maxLength) {
      errors.location = `Location must be less than ${MEETUP_CONFIG.validation.location.maxLength} characters`;
    }

    // Virtual link validation (required if isVirtual is true)
    if (data.isVirtual === true) {
      if (!data.virtualLink || data.virtualLink.trim().length === 0) {
        errors.virtualLink = 'Virtual link is required for virtual events';
      } else if (!MEETUP_CONFIG.validation.virtualLink.pattern.test(data.virtualLink)) {
        errors.virtualLink = 'Virtual link must be a valid URL (http:// or https://)';
      }
    }

    // Meetup type validation
    const validTypes = MEETUP_CONFIG.meetupTypes.map(t => t.value);
    if (!data.meetupType) {
      errors.meetupType = 'Meetup type is required';
    } else if (!validTypes.includes(data.meetupType)) {
      errors.meetupType = `Meetup type must be one of: ${validTypes.join(', ')}`;
    }

    // Tags validation (max 10 tags, each max 30 characters)
    if (data.tags) {
      if (data.tags.length > MEETUP_CONFIG.validation.tags.maxCount) {
        errors.tags = `Maximum ${MEETUP_CONFIG.validation.tags.maxCount} tags allowed`;
      } else if (data.tags.some(tag => tag.length > MEETUP_CONFIG.validation.tags.maxLength)) {
        errors.tags = `Each tag must be less than ${MEETUP_CONFIG.validation.tags.maxLength} characters`;
      }
    }

    // Co-hosts validation (max 10)
    if (data.coHosts && data.coHosts.length > MEETUP_CONFIG.validation.coHosts.maxCount) {
      errors.coHosts = `Maximum ${MEETUP_CONFIG.validation.coHosts.maxCount} co-hosts allowed`;
    }

    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      logger.debug('Meetup validation failed', {
        service: 'MeetValidationService',
        method: 'validateMeetupData',
        errorCount: Object.keys(errors).length,
        errors,
      });
    }

    return {
      valid: isValid,
      errors,
    };
  }

  /**
   * Validate start time allows minimum advance notice
   * Used for creation only (not updates)
   * 
   * @param startTime - Unix timestamp in seconds
   * @returns True if meets minimum advance notice
   */
  static validateMinAdvanceNotice(startTime: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    return startTime >= now + MEETUP_CONFIG.time.minAdvanceNotice;
  }

  /**
   * Validate RSVP status value
   * 
   * @param status - RSVP status to validate
   * @returns True if valid RSVP status
   */
  static validateRSVPStatus(
    status: string
  ): status is 'accepted' | 'declined' | 'tentative' {
    const validStatuses = MEETUP_CONFIG.rsvpStatuses.map(s => s.value);
    return validStatuses.includes(status as 'accepted' | 'declined' | 'tentative');
  }
}

/**
 * Named export for convenience (matches service pattern)
 */
export const validateMeetupData = MeetValidationService.validateMeetupData;
export const validateMinAdvanceNotice = MeetValidationService.validateMinAdvanceNotice;
export const validateRSVPStatus = MeetValidationService.validateRSVPStatus;
