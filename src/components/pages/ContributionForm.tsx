'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  NOMAD_CATEGORIES,
  CONTRIBUTION_TYPES,
  COUNTRIES,
  REGIONS,
} from '@/config/contributions';
import { AttachmentManager } from '@/components/generic/AttachmentManager';
import { UserConsentDialog } from '@/components/generic/UserConsentDialog';
import { GenericAttachment } from '@/types/attachments';
import { X, Loader2 } from 'lucide-react';
import { useContributionPublishing } from '@/hooks/useContributionPublishing';
import { useContributionEditing } from '@/hooks/useContributionEditing';
import { validateContributionData } from '@/services/business/ContributionValidationService';
import { filterVisibleTags } from '@/utils/tagFilter';
import type { ContributionData } from '@/types/contributions';

// Dynamic import for RichTextEditor (client-side only)
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-lg border border-gray-300" />
  }
);

interface ContributionFormData {
  title: string;
  description: string;
  category: string;
  contributionType: string;
  language: string;
  location: string;
  region: string;
  country: string;
  tags: string[];
}

interface ContributionFormProps {
  onContributionCreated?: (contributionId: string) => void;
  onCancel?: () => void;
  defaultValues?: Partial<ContributionFormData & { 
    attachments: GenericAttachment[];
    dTag?: string;
    contributionId?: string; // For editing with selective operations
  }>;
  isEditMode?: boolean;
}

export const ContributionForm = ({ 
  onContributionCreated, 
  onCancel,
  defaultValues,
  isEditMode = false,
}: ContributionFormProps) => {
  const router = useRouter();
  
  // Initialize hooks - use editing hook for edit mode, publishing hook for create mode
  const publishingHook = useContributionPublishing();
  const editingHook = useContributionEditing();
  
  // Choose the appropriate hook based on mode
  const {
    isPublishing,
    uploadProgress,
    currentStep,
    error: publishError,
    result,
    publishContribution,
    consentDialog,
  } = isEditMode && defaultValues?.contributionId ? {
    isPublishing: editingHook.isUpdating,
    uploadProgress: editingHook.updateProgress,
    currentStep: editingHook.updateProgress?.step || 'idle',
    error: editingHook.updateError,
    result: null, // Editing doesn't use result the same way
    publishContribution: async (data: ContributionData, attachmentFiles: File[]) => {
      // For editing, track selective operations based on current form attachments
      const existingAttachments = defaultValues?.attachments || [];
      const currentAttachmentIds = attachments.map(a => a.id); // Use component state attachments
      
      // Track removed and kept attachments
      const removedAttachments = existingAttachments
        .filter(a => !currentAttachmentIds.includes(a.id))
        .map(a => a.id);
      const keptAttachments = existingAttachments
        .filter(a => currentAttachmentIds.includes(a.id))
        .map(a => a.id);
      
      const result = await editingHook.updateContributionData(
        defaultValues.contributionId!,
        {
          title: data.title,
          description: data.description,
          category: data.category,
          contributionType: data.contributionType,
          language: data.language,
          location: data.location,
          region: data.region,
          country: data.country,
          tags: data.tags,
        },
        attachmentFiles, // Use the passed attachmentFiles parameter (new files to upload)
        { removedAttachments, keptAttachments }
      );
      
      return result;
    },
    consentDialog: publishingHook.consentDialog, // Use publishing hook's consent dialog
  } : publishingHook;

  const [formData, setFormData] = useState<ContributionFormData>({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    category: defaultValues?.category || '',
    contributionType: defaultValues?.contributionType || '',
    language: defaultValues?.language || '',
    location: defaultValues?.location || '',
    region: defaultValues?.region || '',
    country: defaultValues?.country || '',
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
        category: defaultValues.category || '',
        contributionType: defaultValues.contributionType || '',
        language: defaultValues.language || '',
        location: defaultValues.location || '',
        region: defaultValues.region || '',
        country: defaultValues.country || '',
        tags: filterVisibleTags(defaultValues.tags || []),
      });
      
      if (defaultValues.attachments) {
        setAttachments(defaultValues.attachments);
      }
    }
  }, [defaultValues]);

  // Auto-redirect to detail page after successful publication
  useEffect(() => {
    console.log('[ContributionForm] Redirect useEffect triggered', { 
      hasResult: !!result, 
      success: result?.success, 
      dTag: result?.dTag,
      isPublishing 
    });
    
    // Only redirect when publishing is complete and we have a successful result with dTag
    if (result?.success && result.dTag && !isPublishing) {
      console.log('[ContributionForm] Setting redirect timer for dTag:', result.dTag);
      
      // Wait 0.5 seconds to show success message, then redirect
      const redirectTimer = setTimeout(() => {
        console.log('[ContributionForm] Redirecting to:', `/explore/${result.dTag}`);
        router.push(`/explore/${result.dTag}`);
      }, 500);

      return () => {
        console.log('[ContributionForm] Clearing redirect timer');
        clearTimeout(redirectTimer);
      };
    }
  }, [result, isPublishing, router]);

  const handleInputChange = (field: keyof ContributionFormData, value: string) => {
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
    
    // Map form data to ContributionData
    const contributionData: ContributionData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      contributionType: formData.contributionType,
      language: formData.language,
      location: formData.location,
      region: formData.region,
      country: formData.country,
      tags: formData.tags,
      attachments: [], // Attachments will be populated from files during upload
    };
    
    // Client-side validation for instant feedback
    const validation = validateContributionData(contributionData);
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
    const publishResult = await publishContribution(
      contributionData,
      attachmentFiles,
      defaultValues?.dTag // Pass existing dTag for updates
    );
    
    // Handle success
    if (publishResult.success && publishResult.eventId) {
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        category: '',
        contributionType: '',
        language: '',
        location: '',
        region: '',
        country: '',
        tags: [],
      });
      setAttachments([]);
      setTagInput('');
      setErrors({});
      
      // Call the callback if provided
      if (onContributionCreated) {
        onContributionCreated(publishResult.eventId);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-purple-800 mb-2">
          {isEditMode ? 'Edit Contribution' : 'Share Your Nomad Experience'}
        </h2>
        <p className="text-gray-600">
          {isEditMode 
            ? 'Update your nomadic experience, knowledge, or resource.'
            : 'Share your travel experiences, tips, and resources with the nomad community.'
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
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Best Coworking Spaces in Bali, Visa Tips for Portugal"
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Category and Contribution Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {NOMAD_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="contributionType" className="block text-sm font-medium text-gray-700 mb-2">
                Contribution Type <span className="text-red-500">*</span>
              </label>
              <select
                id="contributionType"
                value={formData.contributionType}
                onChange={(e) => handleInputChange('contributionType', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.contributionType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select contribution type</option>
                {CONTRIBUTION_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.contributionType && <p className="mt-1 text-sm text-red-600">{errors.contributionType}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Details & Location */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Details & Location</h3>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Share your experience, tips, or knowledge in detail using rich formatting
            </p>
            <RichTextEditor
              value={formData.description || ''}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Describe your experience, share tips, recommendations, or useful information for other nomads..."
              maxLength={50000}
              minHeight={200}
              error={errors.description}
            />
          </div>

          {/* Region and Country */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.region ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a region</option>
                {REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                City/Place
              </label>
              <input
                type="text"
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="e.g., Bali, Lisbon, Chiang Mai"
                maxLength={100}
              />
            </div>
          </div>

          {/* Language */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
              Language
            </label>
            <input
              type="text"
              id="language"
              value={formData.language || ''}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., English, Spanish, Thai"
            />
            <p className="mt-1 text-xs text-gray-500">Primary language of this content</p>
          </div>
        </div>

        {/* Section 4: Media & Attachments */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Media & Attachments</h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload photos, videos, or audio to illustrate your contribution
            </p>
          </div>

          <AttachmentManager
            initialAttachments={attachments}
            onAttachmentsChange={handleAttachmentsChange}
            onError={handleAttachmentError}
            config={{
              maxAttachments: 5,
              supportedTypes: ['image/*', 'video/*', 'audio/*'],
            }}
          />
          {errors.attachments && <p className="mt-2 text-sm text-red-600">{errors.attachments}</p>}
        </div>

        {/* Section 6: Tags & Keywords */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Tags & Keywords</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add keywords to help others discover this contribution
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
                placeholder="e.g., coworking, visa, remote-work"
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
              : (isEditMode ? 'Update Contribution' : 'Submit Contribution')
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
              <strong>Success!</strong> Your contribution has been {isEditMode ? 'updated' : 'published'} successfully.
              {result.dTag && (
                <span className="block mt-1 text-green-700">
                  Redirecting to your contribution page...
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
