'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  CURRENCIES,
} from '@/config/shop';
import { AttachmentManager } from '@/components/generic/AttachmentManager';
import { UserConsentDialog } from '@/components/generic/UserConsentDialog';
import { GenericAttachment } from '@/types/attachments';
import { X, Loader2 } from 'lucide-react';
import { useShopPublishing } from '@/hooks/useShopPublishing';
import { useProductEditing } from '@/hooks/useProductEditing';
import { validateProductData } from '@/services/business/ProductValidationService';
import { filterVisibleTags } from '@/utils/tagFilter';
import type { ProductData } from '@/types/shop';

// Dynamic import for RichTextEditor (client-side only)
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-lg border border-gray-300" />
  }
);

interface ProductFormData {
  title: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  condition: string;
  location: string;
  contact: string;
  tags: string[];
}

interface ProductFormProps {
  onProductCreated?: (productId: string) => void;
  onCancel?: () => void;
  defaultValues?: Partial<ProductFormData & { 
    attachments: GenericAttachment[];
    dTag?: string;
    productId?: string; // For editing with selective operations
  }>;
  isEditMode?: boolean;
}

export const ProductForm = ({ 
  onProductCreated, 
  onCancel,
  defaultValues,
  isEditMode = false,
}: ProductFormProps) => {
  const router = useRouter();
  
  // Initialize hooks - use editing hook for edit mode, publishing hook for create mode
  const publishingHook = useShopPublishing();
  const editingHook = useProductEditing();
  
  // Choose the appropriate hook based on mode
  const {
    isPublishing,
    uploadProgress,
    currentStep,
    error: publishError,
    result,
    publishProduct,
    consentDialog,
  } = isEditMode && defaultValues?.productId ? {
    isPublishing: editingHook.isUpdating,
    uploadProgress: editingHook.updateProgress,
    currentStep: editingHook.updateProgress?.step || 'idle',
    error: editingHook.updateError,
    result: null, // Editing doesn't use result the same way
    publishProduct: async (data: ProductData, attachmentFiles: File[]) => {
      // For editing, track selective operations based on current form attachments
      const existingAttachments = defaultValues?.attachments || [];
      const currentAttachmentUrls = attachments.map(a => a.url).filter((url): url is string => !!url);
      
      // Track removed and kept attachments by URL (Shop uses URLs not IDs)
      const removedAttachments = existingAttachments
        .filter(a => a.url && !currentAttachmentUrls.includes(a.url))
        .map(a => a.url!)
        .filter((url): url is string => !!url);
      const keptAttachments = existingAttachments
        .filter(a => a.url && currentAttachmentUrls.includes(a.url))
        .map(a => a.url!)
        .filter((url): url is string => !!url);
      
      // Call updateContent with selective operations
      const result = await editingHook.updateContent(
        defaultValues.dTag!, // contentId (dTag for fetching existing product)
        {
          title: data.title,
          description: data.description,
          price: data.price,
          currency: data.currency,
          category: data.category,
          condition: data.condition,
          location: data.location,
          contact: data.contact,
          tags: data.tags,
          attachments: [], // Attachments populated from files
        },
        attachmentFiles,
        { removedAttachments, keptAttachments } // Pass selective operations
      );
      
      // Return the result (success status and eventId)
      // Fallback to dTag if eventId not returned (though it should always be returned on success)
      return { success: result.success, eventId: result.eventId || defaultValues.dTag! };
    },
    consentDialog: publishingHook.consentDialog, // Use publishing hook's consent dialog
  } : publishingHook;

  const [formData, setFormData] = useState<ProductFormData>({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    price: defaultValues?.price || '',
    currency: defaultValues?.currency || 'USD',
    category: defaultValues?.category || '',
    condition: defaultValues?.condition || '',
    location: defaultValues?.location || '',
    contact: defaultValues?.contact || '',
    tags: filterVisibleTags(defaultValues?.tags || []),
  });
  const [attachments, setAttachments] = useState<GenericAttachment[]>(defaultValues?.attachments || []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form data when defaultValues change (important for edit mode when data loads asynchronously)
  useEffect(() => {
    if (defaultValues) {
      setFormData({
        title: defaultValues.title || '',
        description: defaultValues.description || '',
        price: defaultValues.price || '',
        currency: defaultValues.currency || 'USD',
        category: defaultValues.category || '',
        condition: defaultValues.condition || '',
        location: defaultValues.location || '',
        contact: defaultValues.contact || '',
        tags: filterVisibleTags(defaultValues.tags || []),
      });
      
      if (defaultValues.attachments) {
        setAttachments(defaultValues.attachments);
      }
    }
  }, [defaultValues]);

  // Auto-redirect to detail page after successful publication
  useEffect(() => {
    console.log('[ProductForm] Redirect useEffect triggered', { 
      hasResult: !!result, 
      success: result?.success, 
      dTag: result?.dTag,
      isPublishing 
    });
    
    // Only redirect when publishing is complete and we have a successful result with dTag
    if (result?.success && result.dTag && !isPublishing) {
      console.log('[ProductForm] Setting redirect timer for dTag:', result.dTag);
      
      // Wait 0.5 seconds to show success message, then redirect
      const redirectTimer = setTimeout(() => {
        console.log('[ProductForm] Redirecting to:', `/shop/${result.dTag}`);
        router.push(`/shop/${result.dTag}`);
      }, 500);

      return () => {
        console.log('[ProductForm] Clearing redirect timer');
        clearTimeout(redirectTimer);
      };
    }
  }, [result, isPublishing, router]);

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAttachmentsChange = (newAttachments: GenericAttachment[]) => {
    setAttachments(newAttachments);
    
    // Clear any attachment-related errors
    if (errors.attachments) {
      setErrors(prev => ({ ...prev, attachments: '' }));
    }
  };

  const handleAttachmentError = (error: string) => {
    setErrors(prev => ({ ...prev, attachments: error }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      const newTags = [...formData.tags, tagInput.trim()];
      setFormData(prev => ({ ...prev, tags: newTags }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Map form data to ProductData
    const productData: ProductData = {
      title: formData.title,
      description: formData.description,
      price: parseFloat(formData.price),
      currency: formData.currency as 'BTC' | 'sats' | 'USD',
      category: formData.category,
      condition: formData.condition as 'new' | 'used' | 'refurbished',
      location: formData.location,
      contact: formData.contact,
      tags: formData.tags,
      attachments: [], // Attachments will be populated from files during upload
    };
    
    // Client-side validation for instant feedback
    const validation = validateProductData(productData);
    if (!validation.valid) {
      setErrors(validation.errors);
      // Scroll to first error
      const firstErrorField = Object.keys(validation.errors)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      return;
    }
    
    // Clear any previous errors
    setErrors({});
    
    // Extract File objects from attachments
    const attachmentFiles = attachments
      .map(att => att.originalFile)
      .filter((file): file is File => file !== undefined);
    
    // Publish to Nostr (pass files and dTag if editing)
    const publishResult = await publishProduct(
      productData,
      attachmentFiles,
      defaultValues?.dTag // Pass existing dTag for updates
    );
    
    // Handle success
    if (publishResult && publishResult.success && publishResult.eventId) {
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        price: '',
        currency: 'USD',
        category: '',
        condition: '',
        location: '',
        contact: '',
        tags: [],
      });
      setAttachments([]);
      setTagInput('');
      setErrors({});
      
      // Call the callback if provided
      if (onProductCreated) {
        onProductCreated(publishResult.eventId);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-purple-800 mb-2">
          {isEditMode ? 'Edit Product' : 'List a Product'}
        </h2>
        <p className="text-gray-600">
          {isEditMode 
            ? 'Update your product listing details.'
            : 'Share products, services, or items with the nomad community.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={isPublishing} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Basic Information</h3>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Product Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Vintage Fuji X100T Camera, Web Design Services"
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Category and Condition */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                id="condition"
                value={formData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.condition ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select condition</option>
                {PRODUCT_CONDITIONS.map((cond) => (
                  <option key={cond.id} value={cond.id}>
                    {cond.name}
                  </option>
                ))}
              </select>
              {errors.condition && <p className="mt-1 text-sm text-red-600">{errors.condition}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Product Details */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Product Details</h3>
          </div>

          {/* Price and Currency */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="price"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 100"
                min="0"
                step="0.01"
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                Currency <span className="text-red-500">*</span>
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.currency ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {CURRENCIES.map((curr) => (
                  <option key={curr.id} value={curr.id}>
                    {curr.symbol} - {curr.name}
                  </option>
                ))}
              </select>
              {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Bali, Indonesia or Remote/Online"
              maxLength={100}
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            <p className="mt-1 text-xs text-gray-500">Where the product is located or can be accessed</p>
          </div>

          {/* Contact */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
              Contact Method <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contact"
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.contact ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Telegram @username, email@example.com, npub..."
              maxLength={200}
            />
            {errors.contact && <p className="mt-1 text-sm text-red-600">{errors.contact}</p>}
            <p className="mt-1 text-xs text-gray-500">How buyers can reach you (email, Telegram, Nostr npub, etc.)</p>
          </div>
        </div>

        {/* Section 3: Description */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Description</h3>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Product Description <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Describe your product in detail using rich formatting
            </p>
            <RichTextEditor
              value={formData.description || ''}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Describe your product, its features, specifications, why you're selling it, any defects or notable details..."
              maxLength={50000}
              minHeight={200}
              error={errors.description}
            />
          </div>
        </div>

        {/* Section 4: Media & Attachments */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Media & Attachments</h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload photos, videos, or documents to showcase your product
            </p>
          </div>

          <AttachmentManager
            initialAttachments={attachments}
            onAttachmentsChange={handleAttachmentsChange}
            onError={handleAttachmentError}
            config={{
              maxAttachments: 10,
              supportedTypes: ['image/*', 'video/*', 'application/pdf'],
            }}
          />
          {errors.attachments && <p className="mt-2 text-sm text-red-600">{errors.attachments}</p>}
        </div>

        {/* Section 5: Tags & Keywords */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Tags & Keywords</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add keywords to help others discover this product
            </p>
          </div>

          <div>
            <label htmlFor="tagInput" className="block text-sm font-medium text-gray-700 mb-2">
              Add Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., camera, remote-work, nomad-gear"
                maxLength={30}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-lg transition-colors duration-200"
              >
                Add Tag
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-purple-900"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        </fieldset>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPublishing}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPublishing}
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPublishing 
              ? (isEditMode ? 'Updating...' : 'Publishing...') 
              : (isEditMode ? 'Update Product' : 'List Product')
            }
          </button>
        </div>

        {/* Publishing Progress */}
        {isPublishing && currentStep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{isEditMode ? 'Updating' : 'Publishing'}:</strong> {currentStep}
              {typeof uploadProgress === 'number' && uploadProgress > 0 && uploadProgress < 100 && (
                <span className="ml-2">({uploadProgress}%)</span>
              )}
              {typeof uploadProgress === 'object' && uploadProgress?.progress !== undefined && (
                <span className="ml-2">({uploadProgress.progress}%)</span>
              )}
            </p>
          </div>
        )}

        {/* Success Message with Redirect Notice */}
        {result?.success && result.eventId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Success!</strong> Your product has been {isEditMode ? 'updated' : 'published'} successfully.
              {result.dTag && (
                <span className="block mt-1 text-green-700">
                  Redirecting to your product page...
                </span>
              )}
            </p>
          </div>
        )}

        {/* Error Message with Retry Option */}
        {publishError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {publishError}
            </p>
            <p className="text-xs text-red-700 mt-2">
              You can fix any issues above and try publishing again.
            </p>
          </div>
        )}
      </form>

      {/* Consent Dialog */}
      <UserConsentDialog
        isOpen={consentDialog.isOpen}
        onClose={consentDialog.closeDialog}
        onConfirm={(accepted) => {
          if (accepted) {
            consentDialog.acceptConsent();
          } else {
            consentDialog.cancelConsent();
          }
        }}
        files={consentDialog.consent?.files?.map(f => {
          // Create a Blob with the correct size to display properly in the dialog
          const blob = new Blob([new ArrayBuffer(f.size)], { type: f.type });
          return new File([blob], f.name, { type: f.type });
        }) || []}
        estimatedTime={consentDialog.consent?.estimatedTime || 0}
        totalSize={consentDialog.consent?.totalSize || 0}
      />
    </div>
  );
};
