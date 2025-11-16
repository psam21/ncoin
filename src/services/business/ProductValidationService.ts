import { logger } from '@/services/core/LoggingService';
import type { ProductData, ProductValidationResult } from '@/types/shop';
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS, CURRENCIES } from '@/config/shop';

/**
 * Business service for product data validation
 * Validates against business rules for marketplace products
 */
export class ProductValidationService {
  /**
   * Validate product data against business rules
   * 
   * @param data - Partial product data to validate
   * @returns Validation result with errors keyed by field name
   */
  static validateProductData(
    data: Partial<ProductData>
  ): ProductValidationResult {
    const errors: ProductValidationResult['errors'] = {};

    // Title validation (5-100 characters)
    if (!data.title || data.title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters';
    } else if (data.title.trim().length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }

    // Description validation (20-5000 characters)
    if (!data.description || data.description.trim().length < 20) {
      errors.description = 'Description must be at least 20 characters';
    } else if (data.description.trim().length > 5000) {
      errors.description = 'Description must be less than 5000 characters';
    }

    // Price validation (must be positive number)
    if (data.price === undefined || data.price === null) {
      errors.price = 'Price is required';
    } else if (typeof data.price !== 'number' || data.price <= 0) {
      errors.price = 'Price must be a positive number';
    } else if (data.price > 1000000000) {
      errors.price = 'Price is unreasonably high';
    }

    // Currency validation
    const validCurrencies = CURRENCIES.map(c => c.id);
    if (!data.currency) {
      errors.currency = 'Currency is required';
    } else if (!validCurrencies.includes(data.currency)) {
      errors.currency = `Currency must be one of: ${validCurrencies.join(', ')}`;
    }

    // Category validation
    const validCategories = PRODUCT_CATEGORIES.map(c => c.id);
    if (!data.category) {
      errors.category = 'Category is required';
    } else if (!validCategories.includes(data.category)) {
      errors.category = 'Invalid category selected';
    }

    // Condition validation
    const validConditions = PRODUCT_CONDITIONS.map(c => c.id);
    if (!data.condition) {
      errors.condition = 'Condition is required';
    } else if (!validConditions.includes(data.condition)) {
      errors.condition = `Condition must be one of: ${validConditions.join(', ')}`;
    }

    // Location validation (3-100 characters)
    if (!data.location || data.location.trim().length < 3) {
      errors.location = 'Location must be at least 3 characters';
    } else if (data.location.trim().length > 100) {
      errors.location = 'Location must be less than 100 characters';
    }

    // Contact validation (required, basic check)
    if (!data.contact || data.contact.trim().length < 3) {
      errors.contact = 'Contact information is required';
    } else if (data.contact.trim().length > 200) {
      errors.contact = 'Contact information is too long';
    }

    // Attachments validation (max 10 files)
    if (data.attachments && data.attachments.length > 10) {
      errors.attachments = 'Maximum 10 media files allowed';
    }

    // Tags validation (max 20 tags)
    if (data.tags && data.tags.length > 20) {
      errors.tags = 'Maximum 20 tags allowed';
    }

    const isValid = Object.keys(errors).length === 0;

    if (!isValid) {
      logger.debug('Product validation failed', {
        service: 'ProductValidationService',
        method: 'validateProductData',
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
 * Named export for convenience (matches service pattern)
 */
export const validateProductData = 
  ProductValidationService.validateProductData;
