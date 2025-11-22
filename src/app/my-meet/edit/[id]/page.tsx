'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchMeetupByDTag } from '@/services/business/MeetService';
import { MeetupEvent } from '@/types/meetup';
import { logger } from '@/services/core/LoggingService';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';
import { MeetupForm } from '@/components/pages/MeetupForm';

export default function EditMeetupPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();

  const [meetup, setMeetup] = useState<MeetupEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dTag = params.id as string;

  // Load meetup data
  useEffect(() => {
    const loadMeetup = async () => {
      if (!dTag) {
        setError('Meetup ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const meetupData = await fetchMeetupByDTag('', dTag);

        if (!meetupData) {
          setError('Meetup not found');
          return;
        }

        // Verify ownership
        if (meetupData.pubkey !== user?.pubkey) {
          setError('You can only edit your own meetups');
          return;
        }

        setMeetup(meetupData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load meetup';
        logger.error('Error loading meetup for edit', err instanceof Error ? err : new Error(errorMsg), {
          service: 'EditMeetupPage',
          method: 'loadMeetup',
          dTag,
        });
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadMeetup();
  }, [dTag, user?.pubkey]);

  const handleMeetupUpdated = (meetupId: string) => {
    console.log('Meetup updated:', meetupId);
    router.push('/my-meet');
  };

  const handleCancel = () => {
    router.push('/my-meet');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-16">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to edit meetups.
            </p>
            <Link href="/signin" className="btn-primary-sm">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-16">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600 text-lg">Loading meetup...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !meetup) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container-width py-8">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6 text-center max-w-md">
                {error || 'Meetup not found'}
              </p>
              <button
                onClick={() => router.push('/my-meet')}
                className="btn-primary-sm"
              >
                Back to My Meetups
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Convert MeetupEvent to form default values
  // Convert unix timestamps to ISO strings for form inputs
  const startTimeISO = new Date(meetup.startTime * 1000).toISOString().slice(0, 16);
  const endTimeISO = meetup.endTime ? new Date(meetup.endTime * 1000).toISOString().slice(0, 16) : '';

  const defaultValues = {
    name: meetup.name,
    description: meetup.description,
    startTime: startTimeISO,
    endTime: endTimeISO,
    location: meetup.location,
    isVirtual: meetup.isVirtual,
    virtualLink: meetup.virtualLink || '',
    meetupType: meetup.meetupType,
    imageUrl: meetup.imageUrl,
    tags: meetup.tags,
    dTag,
  };

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Hero Section */}
      <section className="pt-16 lg:pt-20 pb-12 bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 mr-3" />
              <h1 className="text-3xl md:text-4xl font-serif font-bold">
                Edit Meetup
              </h1>
            </div>
            <p className="text-lg text-purple-50 max-w-2xl mx-auto">
              Update your meetup details and keep your community informed
            </p>
          </div>
        </div>
      </section>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-900">Edit Meetup</h1>
              <p className="text-gray-600 text-lg mt-1">
                Update your meetup listing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        <MeetupForm
          onMeetupCreated={handleMeetupUpdated}
          onCancel={handleCancel}
          defaultValues={defaultValues}
          isEditMode={true}
        />
      </div>
    </div>
  );
}
