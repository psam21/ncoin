'use client';

import React, { useState } from 'react';
import { Copy, Check, Link2, Settings, Calendar, Clock } from 'lucide-react';

interface MeetingURLCreatorProps {
  onCreateMeeting: (config: MeetingConfig) => { url: string; id: string };
  onClose: () => void;
  meetingType: 'video' | 'chat';
}

interface MeetingConfig {
  title: string;
  type: 'video' | 'chat';
  expiresIn?: number; // hours
  requireAuth?: boolean;
  maxParticipants?: number;
}

export function MeetingURLCreator({ onCreateMeeting, onClose, meetingType }: MeetingURLCreatorProps) {
  const [title, setTitle] = useState('');
  const [expiresIn, setExpiresIn] = useState(24);
  const [requireAuth, setRequireAuth] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleCreate = () => {
    const config: MeetingConfig = {
      title: title || `${meetingType === 'video' ? 'Video Meeting' : 'Burner Chat'}`,
      type: meetingType,
      expiresIn,
      requireAuth,
      maxParticipants,
    };

    const result = onCreateMeeting(config);
    setCreatedUrl(result.url);
  };

  const handleCopy = () => {
    if (createdUrl) {
      navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Link2 className="w-6 h-6" />
            Create {meetingType === 'video' ? 'Video Meeting' : 'Burner Chat'}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {!createdUrl ? (
            <>
              {/* Meeting Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`My ${meetingType === 'video' ? 'Video Meeting' : 'Chat Room'}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Quick Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Expires In
                  </label>
                  <select
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={1}>1 hour</option>
                    <option value={3}>3 hours</option>
                    <option value={6}>6 hours</option>
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={72}>3 days</option>
                    <option value={168}>1 week</option>
                    <option value={0}>Never</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Participants
                  </label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value={2}>2 people</option>
                    <option value={5}>5 people</option>
                    <option value={10}>10 people</option>
                    <option value={25}>25 people</option>
                    <option value={50}>50 people</option>
                    <option value={0}>Unlimited</option>
                  </select>
                </div>
              </div>

              {/* Advanced Settings Toggle */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </button>

              {showAdvanced && (
                <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireAuth}
                      onChange={(e) => setRequireAuth(e.target.checked)}
                      className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        Require Authentication
                      </div>
                      <div className="text-xs text-gray-600">
                        Only signed-in Nostr users can join
                      </div>
                    </div>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  Create Meeting URL
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Meeting Created!
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Share this link with participants
                </p>

                {/* URL Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 text-left">
                      <div className="text-xs text-gray-500 mb-1">Meeting URL</div>
                      <div className="text-purple-600 font-mono text-sm break-all">
                        {createdUrl}
                      </div>
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Meeting Details */}
                <div className="bg-purple-50 rounded-lg p-4 mb-6 text-left space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Title:</span>
                    <span>{title || 'Untitled Meeting'}</span>
                  </div>
                  {expiresIn > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Expires in:</span>
                      <span>{expiresIn} hour{expiresIn !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDone}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
