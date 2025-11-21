'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { WorkForm } from '@/components/pages/WorkForm';
import { Briefcase } from 'lucide-react';

export default function WorkCreatePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    // Only check auth after hydration is complete
    if (_hasHydrated && !user) {
      router.push('/signin?returnUrl=' + encodeURIComponent('/my-work/create'));
    }
  }, [_hasHydrated, user, router]);

  const handleWorkCreated = (workId: string) => {
    console.log('Work created:', workId);
    // Redirect handled by WorkForm
  };

  const handleCancel = () => {
    router.push('/my-work');
  };

  // Show loading state while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // After hydration, if no user, return null (redirect will happen via useEffect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary-600" />
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-900">Post a Work Opportunity</h1>
              <p className="text-gray-600 text-lg mt-1">
                Share job openings with the digital nomad community
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        <WorkForm
          onWorkCreated={handleWorkCreated}
          onCancel={handleCancel}
          isEditMode={false}
        />
      </div>
    </div>
  );
}
