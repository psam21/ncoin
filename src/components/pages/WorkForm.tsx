'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  WORK_CATEGORIES,
  WORK_JOB_TYPES,
  WORK_DURATIONS,
  WORK_CURRENCIES,
} from '@/config/work';
import { COUNTRIES, REGIONS } from '@/config/contributions';
import { AttachmentManager } from '@/components/generic/AttachmentManager';
import { UserConsentDialog } from '@/components/generic/UserConsentDialog';
import { GenericAttachment } from '@/types/attachments';
import { X, Loader2 } from 'lucide-react';
import { useWorkPublishing } from '@/hooks/useWorkPublishing';
import { validateWorkData } from '@/services/business/WorkValidationService';
import { filterVisibleTags } from '@/utils/tagFilter';
import type { WorkData } from '@/types/work';

// Dynamic import for RichTextEditor (client-side only)
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-lg border border-gray-300" />
  }
);

interface WorkFormData {
  title: string;
  description: string;
  category: string;
  jobType: string;
  duration: string;
  payRate: string;
  currency: string;
  contact: string;
  language: string;
  location: string;
  region: string;
  country: string;
  tags: string[];
}

interface WorkFormProps {
  onWorkCreated?: (workId: string) => void;
  onCancel?: () => void;
  defaultValues?: Partial<WorkFormData & { 
    attachments: GenericAttachment[];
    dTag?: string;
    workId?: string;
  }>;
  isEditMode?: boolean;
}

export const WorkForm = ({ 
  onWorkCreated, 
  onCancel,
  defaultValues,
  isEditMode = false,
}: WorkFormProps) => {
  const router = useRouter();
  
  // useWorkPublishing handles both create and edit modes
  const {
    publishWork,
    state,
    consentDialog,
  } = useWorkPublishing();
  
  const { isPublishing, uploadProgress, currentStep, error: publishError, result } = state;

  const [formData, setFormData] = useState<WorkFormData>({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    category: defaultValues?.category || '',
    jobType: defaultValues?.jobType || '',
    duration: defaultValues?.duration || '',
    payRate: defaultValues?.payRate || '',
    currency: defaultValues?.currency || '',
    contact: defaultValues?.contact || '',
    language: defaultValues?.language || 'en',
    location: defaultValues?.location || '',
    region: defaultValues?.region || '',
    country: defaultValues?.country || '',
    tags: filterVisibleTags(defaultValues?.tags || []),
  });
  
  const [attachments, setAttachments] = useState<GenericAttachment[]>(defaultValues?.attachments || []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync form data when defaultValues change
  useEffect(() => {
    if (defaultValues) {
      setFormData({
        title: defaultValues.title || '',
        description: defaultValues.description || '',
        category: defaultValues.category || '',
        jobType: defaultValues.jobType || '',
        duration: defaultValues.duration || '',
        payRate: defaultValues.payRate || '',
        currency: defaultValues.currency || '',
        contact: defaultValues.contact || '',
        language: defaultValues.language || 'en',
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

  // Auto-redirect after successful publication
  useEffect(() => {
    if (result?.success && result.dTag && !isPublishing) {
      const redirectTimer = setTimeout(() => {
        router.push(`/work/${result.dTag}`);
      }, 500);
      return () => clearTimeout(redirectTimer);
    }
  }, [result, isPublishing, router]);

  const handleInputChange = (field: keyof WorkFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAttachmentsChange = (newAttachments: GenericAttachment[]) => {
    setAttachments(newAttachments);
    if (errors.attachments) {
      setErrors(prev => ({ ...prev, attachments: '' }));
    }
  };

  const handleAttachmentError = (error: string) => {
    setErrors(prev => ({ ...prev, attachments: error }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const workData: WorkData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      jobType: formData.jobType,
      duration: formData.duration,
      payRate: parseFloat(formData.payRate) || 0,
      currency: formData.currency,
      contact: formData.contact || undefined,
      language: formData.language,
      location: formData.location,
      region: formData.region,
      country: formData.country,
      tags: formData.tags,
      attachments: attachments,
    };
    
    // Validate
    const validation = validateWorkData(workData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    
    // Extract files for upload - attachments are already GenericAttachment[]
    const filesToUpload: File[] = [];
    
    // Publish work opportunity
    const result = await publishWork(
      workData,
      filesToUpload,
      defaultValues?.dTag
    );
    
    if (result.success && onWorkCreated) {
      onWorkCreated(result.dTag!);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Job Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-4 py-3 border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
            placeholder="e.g., Full Stack Developer, Content Writer..."
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Category and Job Type Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-4 py-3 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <option value="">Select a category</option>
              {WORK_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>

          <div>
            <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
              Job Type <span className="text-red-500">*</span>
            </label>
            <select
              id="jobType"
              value={formData.jobType}
              onChange={(e) => handleInputChange('jobType', e.target.value)}
              className={`w-full px-4 py-3 border ${errors.jobType ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <option value="">Select job type</option>
              {WORK_JOB_TYPES.map(type => (
                <option key={type.id} value={type.id}>{type.icon} {type.name}</option>
              ))}
            </select>
            {errors.jobType && <p className="mt-1 text-sm text-red-600">{errors.jobType}</p>}
          </div>
        </div>

        {/* Duration, Pay Rate, Currency Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration <span className="text-red-500">*</span>
            </label>
            <select
              id="duration"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              className={`w-full px-4 py-3 border ${errors.duration ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <option value="">Select duration</option>
              {WORK_DURATIONS.map(dur => (
                <option key={dur.id} value={dur.value}>{dur.name}</option>
              ))}
            </select>
            {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
          </div>

          <div>
            <label htmlFor="payRate" className="block text-sm font-medium text-gray-700 mb-2">
              Pay Rate <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="payRate"
              value={formData.payRate}
              onChange={(e) => handleInputChange('payRate', e.target.value)}
              className={`w-full px-4 py-3 border ${errors.payRate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
              placeholder="e.g., 50, 1000"
              min="0"
              step="0.01"
            />
            {errors.payRate && <p className="mt-1 text-sm text-red-600">{errors.payRate}</p>}
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className={`w-full px-4 py-3 border ${errors.currency ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <option value="">Select currency</option>
              {WORK_CURRENCIES.map(curr => (
                <option key={curr.id} value={curr.id}>{curr.symbol} {curr.name}</option>
              ))}
            </select>
            {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Job Description <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={(html) => handleInputChange('description', html)}
            placeholder="Describe the job opportunity, requirements, responsibilities..."
            maxLength={50000}
            minHeight={200}
            error={errors.description}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Contact Information */}
        <div>
          <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
            Contact Information (Optional)
          </label>
          <input
            type="text"
            id="contact"
            value={formData.contact}
            onChange={(e) => handleInputChange('contact', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Email, Telegram, website, etc."
          />
          <p className="mt-1 text-sm text-gray-500">How should interested candidates reach you?</p>
        </div>

        {/* Region and Country Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
              Region <span className="text-red-500">*</span>
            </label>
            <select
              id="region"
              value={formData.region}
              onChange={(e) => {
                handleInputChange('region', e.target.value);
                handleInputChange('country', ''); // Reset country when region changes
              }}
              className={`w-full px-4 py-3 border ${errors.region ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
            >
              <option value="">Select a region</option>
              {REGIONS.map(region => (
                <option key={region.id} value={region.id}>{region.name}</option>
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
              className={`w-full px-4 py-3 border ${errors.country ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500`}
              disabled={!formData.region}
            >
              <option value="">Select a country</option>
              {formData.region && COUNTRIES
                .filter(country => country.region === formData.region)
                .map(country => (
                  <option key={country.id} value={country.id}>{country.name}</option>
                ))}
            </select>
            {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
          </div>
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Specific Location (Optional)
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="City, state, or specific area..."
          />
        </div>

        {/* Tags */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            Tags (Optional)
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Add tags like 'bitcoin', 'remote', 'urgent'..."
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Media Attachments (Optional)
          </label>
          <AttachmentManager
            initialAttachments={attachments}
            onAttachmentsChange={handleAttachmentsChange}
            onError={handleAttachmentError}
            config={{
              maxAttachments: 5,
              supportedTypes: ['image/*', 'video/*', 'audio/*'],
            }}
          />
          {errors.attachments && <p className="mt-1 text-sm text-red-600">{errors.attachments}</p>}
        </div>

        {/* Publishing Progress */}
        {isPublishing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-2" />
              <span className="text-blue-900 font-medium">
                {currentStep === 'validating' && 'Validating...'}
                {currentStep === 'uploading' && 'Uploading media...'}
                {currentStep === 'publishing' && 'Publishing to Nostr...'}
                {currentStep === 'complete' && 'Complete!'}
              </span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {publishError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{publishError}</p>
          </div>
        )}

        {/* Success Message */}
        {result?.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800">Work opportunity published successfully! Redirecting...</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isPublishing}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isPublishing ? 'Publishing...' : (isEditMode ? 'Update Work' : 'Publish Work')}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPublishing}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>
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
          const blob = new Blob([new ArrayBuffer(f.size)], { type: f.type });
          return new File([blob], f.name, { type: f.type });
        }) || []}
        estimatedTime={consentDialog.consent?.estimatedTime || 0}
        totalSize={consentDialog.consent?.totalSize || 0}
      />
    </div>
  );
};
