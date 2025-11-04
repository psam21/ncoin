'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MeetingDashboard } from '@/components/meetings/MeetingDashboard';
import { MeetingURLCreator } from '@/components/meetings/MeetingURLCreator';
import { BurnerChat } from '@/components/meetings/BurnerChat';
import { BurnerCall } from '@/components/meetings/BurnerCall';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Suspense } from 'react';

interface Meeting {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'chat';
  createdAt: Date;
  expiresAt?: Date;
}

interface MeetingConfig {
  title: string;
  type: 'video' | 'chat';
  expiresIn?: number;
  requireAuth?: boolean;
  maxParticipants?: number;
}

function MeetingsPageContent() {
  const searchParams = useSearchParams();
  const isHydrated = useAuthHydration();
  const { isAuthenticated } = useAuthStore();
  
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [creatorType, setCreatorType] = useState<'video' | 'chat'>('video');
  const [activeMeeting, setActiveMeeting] = useState<Meeting | null>(null);
  const [activeView, setActiveView] = useState<'dashboard' | 'chat' | 'call'>('dashboard');

  // Check if user is joining via URL parameter
  React.useEffect(() => {
    const joinParam = searchParams?.get('join');
    if (joinParam) {
      // Find meeting by ID
      const meeting = meetings.find(m => m.id === joinParam);
      if (meeting) {
        handleJoinMeeting(meeting.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, meetings]);

  const handleCreateMeeting = (type: 'video' | 'chat') => {
    setCreatorType(type);
    setShowCreator(true);
  };

  const handleMeetingCreated = (config: MeetingConfig): { url: string; id: string } => {
    const meetingId = Math.random().toString(36).substring(2, 15);
    const meetingUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/meetings?join=${meetingId}`
      : `https://example.com/meetings?join=${meetingId}`;
    
    const expiresAt = config.expiresIn && config.expiresIn > 0
      ? new Date(Date.now() + config.expiresIn * 60 * 60 * 1000)
      : undefined;

    const newMeeting: Meeting = {
      id: meetingId,
      title: config.title,
      url: meetingUrl,
      type: config.type,
      createdAt: new Date(),
      expiresAt,
    };

    setMeetings(prev => [newMeeting, ...prev]);
    setShowCreator(false);

    return {
      url: meetingUrl,
      id: meetingId,
    };
  };

  const handleJoinMeeting = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    setActiveMeeting(meeting);
    setActiveView(meeting.type === 'video' ? 'call' : 'chat');
  };

  const handleCloseMeeting = () => {
    setActiveMeeting(null);
    setActiveView('dashboard');
  };

  // Wait for auth store to hydrate
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="text-center max-w-md px-6">
          <svg
            className="w-16 h-16 text-purple-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-purple-900 mb-2">
            Sign in to access Meetings
          </h2>
          <p className="text-purple-600 mb-6">
            Create and join video meetings and burner chats
          </p>
          <a
            href="/signin"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  // Show active meeting view
  if (activeView === 'chat' && activeMeeting) {
    return (
      <BurnerChat
        meetingId={activeMeeting.id}
        meetingTitle={activeMeeting.title}
        onClose={handleCloseMeeting}
        expiresAt={activeMeeting.expiresAt}
      />
    );
  }

  if (activeView === 'call' && activeMeeting) {
    return (
      <BurnerCall
        meetingId={activeMeeting.id}
        meetingTitle={activeMeeting.title}
        onClose={handleCloseMeeting}
        expiresAt={activeMeeting.expiresAt}
      />
    );
  }

  // Show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container-width section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-purple-800">Meetings</h1>
          <p className="text-orange-600 mt-2 font-medium">
            Create instant video meetings and temporary chat rooms
          </p>
        </div>

        {/* Main Dashboard */}
        <MeetingDashboard
          onCreateMeeting={handleCreateMeeting}
          meetings={meetings}
          onJoinMeeting={handleJoinMeeting}
        />

        {/* Meeting Creator Modal */}
        {showCreator && (
          <MeetingURLCreator
            onCreateMeeting={handleMeetingCreated}
            onClose={() => setShowCreator(false)}
            meetingType={creatorType}
          />
        )}

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3">
              🎥 Video Meetings
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>Instant peer-to-peer video calls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>Screen sharing support</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>No recording or storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">•</span>
                <span>Temporary meeting links</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">
              💬 Burner Chats
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>Temporary chat rooms</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>Auto-expiring conversations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>No message history saved</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>Share via link</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Loading...</p>
        </div>
      </div>
    }>
      <MeetingsPageContent />
    </Suspense>
  );
}
