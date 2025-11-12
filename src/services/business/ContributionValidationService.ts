import { logger } from '@/services/core/LoggingService';
import type { ContributionData, ContributionValidationResult } from '@/types/contributions';

/**
 * Business service for contribution data validation
 * Extracted from types file to maintain proper SOA separation
 */
export class ContributionValidationService {
  /**
   * Validate contribution data against business rules
   * 
   * @param data - Partial contribution data to validate
   * @returns Validation result with errors keyed by field name
   */
  static validateContributionData(
    data: Partial<ContributionData>
  ): ContributionValidationResult {
    const errors: ContributionValidationResult['errors'] = {};

    // Title validation
    if (!data.title || data.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    // Category validation
    if (!data.category) {
      errors.category = 'Category is required';
    }

    // Contribution type validation
    if (!data.contributionType) {
      errors.contributionType = 'Contribution type is required';
    }

    // Description validation
    if (!data.description || data.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    // Region validation
    if (!data.region) {
      errors.region = 'Region is required';
    }

    // Country validation
    if (!data.country) {
      errors.country = 'Country is required';
    }

    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      logger.debug('Contribution validation failed', {
        service: 'ContributionValidationService',
        method: 'validateContributionData',
        errorCount: Object.keys(errors).length,
        errors,
      });
    }

    return {
      valid: isValid,
      errors,
    };
  }
}

/**
 * Named export for convenience (matches old API)
 */
export const validateContributionData = 
  ContributionValidationService.validateContributionData;
