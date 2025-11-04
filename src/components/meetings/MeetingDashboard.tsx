'use client';

import React, { useState } from 'react';
import { Video, MessageSquare, Plus, Copy, Check, Calendar, Clock } from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'chat';
  createdAt: Date;
  expiresAt?: Date;
}

interface MeetingDashboardProps {
  onCreateMeeting: (type: 'video' | 'chat') => void;
  meetings: Meeting[];
  onJoinMeeting: (meetingId: string) => void;
}

export function MeetingDashboard({ onCreateMeeting, meetings, onJoinMeeting }: MeetingDashboardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = (url: string, meetingId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => onCreateMeeting('video')}
          className="group relative overflow-hidden bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
                <Video className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold">New Video Meeting</h3>
                <p className="text-sm text-purple-100">Start an instant call</p>
              </div>
            </div>
            <Plus className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </div>

      {/* Recent/Active Meetings */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-orange-50">
          <h2 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Your Meetings
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {meetings.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings yet</h3>
              <p className="text-gray-600 text-sm">
                Create your first meeting using the buttons above
              </p>
            </div>
          ) : (
            meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="px-6 py-4 hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        meeting.type === 'video'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {meeting.type === 'video' ? (
                        <Video className="w-5 h-5" />
                      ) : (
                        <MessageSquare className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {meeting.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(meeting.createdAt)}
                        </span>
                        {meeting.expiresAt && (
                          <span className="text-orange-600">
                            Expires {formatDate(meeting.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleCopyUrl(meeting.url, meeting.id)}
                      className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Copy meeting URL"
                    >
                      {copiedId === meeting.id ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => onJoinMeeting(meeting.id)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
