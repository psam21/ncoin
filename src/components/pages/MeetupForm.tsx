'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MEETUP_CONFIG } from '@/config/meetup';
import { UserConsentDialog } from '@/components/generic/UserConsentDialog';
import { AttachmentManager } from '@/components/generic/AttachmentManager';
import { X, Loader2, Calendar, MapPin, Video, Globe } from 'lucide-react';
import { useMeetPublishing } from '@/hooks/useMeetPublishing';
import { useMeetupEditing } from '@/hooks/useMeetupEditing';
import { validateMeetupData } from '@/services/business/MeetValidationService';
import { filterVisibleTags } from '@/utils/tagFilter';
import type { MeetupData } from '@/types/meetup';
import type { GenericAttachment } from '@/types/attachments';

// Dynamic import for RichTextEditor (client-side only)
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-lg border border-gray-300" />
  }
);

interface MeetupFormData {
  name: string;
  description: string;
  startTime: string; // ISO date string
  endTime: string;
  location: string;
  isVirtual: boolean;
  virtualLink: string;
  meetupType: string;
  tags: string[];
}

interface MeetupFormProps {
  onMeetupCreated?: (dTag: string) => void;
  onCancel?: () => void;
  defaultValues?: Partial<MeetupFormData & { 
    attachments?: GenericAttachment[];
    dTag?: string;
  }>;
  isEditMode?: boolean;
}

export const MeetupForm = ({ 
  onMeetupCreated, 
  onCancel,
  defaultValues,
  isEditMode = false,
}: MeetupFormProps) => {
  const router = useRouter();
  
  // Initialize hooks - use editing hook for edit mode, publishing hook for create mode
  const publishingHook = useMeetPublishing();
  const editingHook = useMeetupEditing();
  
  // Choose the appropriate hook based on mode
  const {
    isPublishing,
    uploadProgress,
    currentStep,
    error: publishError,
    result,
    publishMeetup,
    consentDialog,
  } = isEditMode && defaultValues?.dTag ? {
    isPublishing: editingHook.isUpdating,
    uploadProgress: editingHook.updateProgress,
    currentStep: editingHook.updateProgress?.step || 'idle',
    error: editingHook.updateError,
    result: editingHook.updateResult,
    publishMeetup: async (data: MeetupData, attachmentFiles: File[]) => {
      const result = await editingHook.updateMeetupContent(
        defaultValues.dTag!,
        {
          name: data.name,
          description: data.description,
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location,
          isVirtual: data.isVirtual,
          virtualLink: data.virtualLink,
          meetupType: data.meetupType,
          tags: data.tags,
          hostPubkey: data.hostPubkey,
          attachments: data.attachments,
        },
        attachmentFiles
      );
      return result.success;
    },
    consentDialog: publishingHook.consentDialog, // Use publishing hook's consent dialog
  } : publishingHook;

  // Get today's date in local timezone for min date
  const getTodayString = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState<MeetupFormData>({
    name: defaultValues?.name || '',
    description: defaultValues?.description || '',
    startTime: defaultValues?.startTime || '',
    endTime: defaultValues?.endTime || '',
    location: defaultValues?.location || '',
    isVirtual: defaultValues?.isVirtual || false,
    virtualLink: defaultValues?.virtualLink || '',
    meetupType: defaultValues?.meetupType || 'gathering',
    tags: defaultValues?.tags || [],
  });

  const [attachments, setAttachments] = useState<GenericAttachment[]>(defaultValues?.attachments || []);
  const [tagInput, setTagInput] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Clear validation errors when user changes field
  useEffect(() => {
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  // Navigate on successful creation
  useEffect(() => {
    if (result?.success && result.dTag) {
      onMeetupCreated?.(result.dTag);
      if (!onMeetupCreated) {
        router.push('/my-meet');
      }
    }
  }, [result, router, onMeetupCreated]);

  const handleInputChange = (field: keyof MeetupFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDescriptionChange = (content: string) => {
    setFormData(prev => ({ ...prev, description: content }));
  };

  const handleAttachmentsChange = (newAttachments: GenericAttachment[]) => {
    setAttachments(newAttachments);
    if (validationErrors.attachments) {
      setValidationErrors(prev => ({ ...prev, attachments: '' }));
    }
  };

  const handleAttachmentError = (error: string) => {
    setValidationErrors(prev => ({ ...prev, attachments: error }));
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/^#/, '');
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates
    const startDate = new Date(formData.startTime);
    const endDate = formData.endTime ? new Date(formData.endTime) : null;

    if (endDate && endDate <= startDate) {
      setValidationErrors({ endTime: 'End time must be after start time' });
      return;
    }

    // Convert to MeetupData
    const meetupData: MeetupData = {
      name: formData.name,
      description: formData.description,
      startTime: Math.floor(startDate.getTime() / 1000),
      endTime: endDate ? Math.floor(endDate.getTime() / 1000) : undefined,
      location: formData.location,
      isVirtual: formData.isVirtual,
      virtualLink: formData.virtualLink || undefined,
      meetupType: formData.meetupType as MeetupData['meetupType'],
      tags: filterVisibleTags(formData.tags),
      hostPubkey: '', // Will be set by hook from auth
      attachments: attachments,
    };

    // Validate
    const validation = validateMeetupData(meetupData);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Extract File objects from attachments
    const filesToUpload = attachments
      .map(att => att.originalFile)
      .filter((file): file is File => file !== undefined);

    // Publish
    await publishMeetup(meetupData, filesToUpload);
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push('/my-meet');
    }
  };

  // Get progress message
  const getProgressMessage = () => {
    if (typeof uploadProgress === 'number') {
      return `Uploading... ${uploadProgress}%`;
    }
    if (uploadProgress && 'message' in uploadProgress) {
      return uploadProgress.message;
    }
    switch (currentStep) {
      case 'validating':
        return 'Validating meetup data...';
      case 'uploading':
        return 'Uploading image...';
      case 'creating':
        return 'Creating event...';
      case 'publishing':
        return 'Publishing to Nostr relays...';
      case 'complete':
        return 'Meetup published!';
      case 'error':
        return 'Error occurred';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-purple-800 mb-2">
          {isEditMode ? 'Edit Meetup' : 'Create New Meetup'}
        </h2>
        <p className="text-gray-600">
          {isEditMode 
            ? 'Update your meetup details'
            : 'Host an event and bring nomads together'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={isPublishing} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Basic Information</h3>
          </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${validationErrors.name ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="e.g., Digital Nomad Coffee Meetup"
            disabled={isPublishing}
            maxLength={100}
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">{formData.name.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <RichTextEditor
            value={formData.description}
            onChange={handleDescriptionChange}
            placeholder="Describe your event, who should attend, what to expect..."
          />
          {validationErrors.description && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
          )}
        </div>

        {/* Meetup Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type *
          </label>
          <select
            value={formData.meetupType}
            onChange={(e) => handleInputChange('meetupType', e.target.value)}
            className="input-field"
            disabled={isPublishing}
          >
            {MEETUP_CONFIG.meetupTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        </div>

        {/* Section 2: Event Details */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-purple-800">Event Details</h3>
          </div>

        {/* Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              className={`input-field ${validationErrors.startTime ? 'border-red-500' : ''}`}
              min={getTodayString()}
              disabled={isPublishing}
            />
            {validationErrors.startTime && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.startTime}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              End Date & Time
            </label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              className={`input-field ${validationErrors.endTime ? 'border-red-500' : ''}`}
              min={formData.startTime || getTodayString()}
              disabled={isPublishing}
            />
            {validationErrors.endTime && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.endTime}</p>
            )}
          </div>
        </div>

        {/* Virtual/Physical Toggle */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isVirtual}
              onChange={(e) => handleInputChange('isVirtual', e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              disabled={isPublishing}
            />
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-600" />
              <div>
                <span className="font-medium text-gray-900">Virtual Event</span>
                <p className="text-xs text-gray-600">This event will be held online</p>
              </div>
            </div>
          </label>
        </div>

        {/* Location or Virtual Link */}
        {formData.isVirtual ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              Virtual Meeting Link *
            </label>
            <input
              type="url"
              value={formData.virtualLink}
              onChange={(e) => handleInputChange('virtualLink', e.target.value)}
              className={`input-field ${validationErrors.virtualLink ? 'border-red-500' : ''}`}
              placeholder="https://zoom.us/j/..."
              disabled={isPublishing}
            />
            {validationErrors.virtualLink && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.virtualLink}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Zoom, Google Meet, or any video call link
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location *
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`input-field ${validationErrors.location ? 'border-red-500' : ''}`}
              placeholder="e.g., Café Central, Lisbon"
              disabled={isPublishing}
            />
            {validationErrors.location && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Include venue name, address, or meeting point
            </p>
          </div>
        )}

        {/* Media Attachments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Media
          </label>
          <AttachmentManager
            initialAttachments={attachments}
            onAttachmentsChange={handleAttachmentsChange}
            onError={handleAttachmentError}
            config={{
              maxAttachments: 10,
              supportedTypes: ['image/*', 'video/*', 'audio/*'],
            }}
          />
          {validationErrors.attachments && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.attachments}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Add images, videos, or audio to showcase your event
          </p>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              className="input-field flex-1"
              placeholder="e.g., networking, coffee, coworking"
              disabled={isPublishing}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn btn-outline"
              disabled={isPublishing}
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-accent-100 text-accent-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-accent-500 hover:text-accent-700"
                    disabled={isPublishing}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Add tags to help people discover your event
          </p>
        </div>
        </div>
        </fieldset>

        {/* Error Message */}
        {publishError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800 font-medium">Error</p>
            <p className="text-sm text-red-700 mt-1">{publishError}</p>
          </div>
        )}

        {/* Progress Message */}
        {isPublishing && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              <div className="flex-1">
                <p className="text-sm text-purple-900 font-medium">
                  {getProgressMessage()}
                </p>
                {typeof uploadProgress === 'number' && (
                  <div className="mt-2 bg-white rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-outline flex-1"
            disabled={isPublishing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isEditMode ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{isEditMode ? 'Update Meetup' : 'Create Meetup'}</>
            )}
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
