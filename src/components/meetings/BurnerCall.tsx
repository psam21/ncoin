'use client';

import React, { useState } from 'react';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users, 
  Clock,
  Monitor,
  MonitorOff,
  Settings,
  Copy,
  Check
} from 'lucide-react';

interface BurnerCallProps {
  meetingId: string;
  meetingTitle: string;
  onClose: () => void;
  expiresAt?: Date;
}

interface Participant {
  id: string;
  name: string;
  isVideoOn: boolean;
  isAudioOn: boolean;
}

export function BurnerCall({ meetingId, meetingTitle, onClose, expiresAt }: BurnerCallProps) {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [username, setUsername] = useState('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const meetingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/meetings?join=${meetingId}` 
    : '';

  const handleJoin = () => {
    if (username.trim()) {
      setIsJoined(true);
      const newParticipant: Participant = {
        id: 'local',
        name: username,
        isVideoOn: true,
        isAudioOn: true,
      };
      setParticipants([newParticipant]);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave this call?')) {
      onClose();
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeRemaining = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {!isJoined ? (
        // Join Screen
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Join Video Meeting
              </h3>
              <p className="text-gray-400">
                Enter your name to join this meeting
              </p>
            </div>

            {/* Video Preview */}
            <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {username.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              </div>
              {!isVideoOn && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <VideoOff className="w-12 h-12 text-white opacity-75" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Pre-join controls */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOn
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
              <button
                onClick={toggleAudio}
                className={`p-4 rounded-full transition-colors ${
                  isAudioOn
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
                title={isAudioOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
              </button>
            </div>

            <button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Meeting
            </button>

            <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
              <p className="font-medium text-white mb-2">⚠️ Burner Call Notice</p>
              <ul className="space-y-1 text-xs">
                <li>• Calls are peer-to-peer (no recording)</li>
                <li>• Meeting expires when time runs out</li>
                <li>• Anyone with the link can join</li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        // In-Call Screen
        <>
          {/* Top Bar */}
          <div className="bg-gray-800 bg-opacity-90 px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-semibold truncate">{meetingTitle}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(new Date())}
                </span>
                {expiresAt && (
                  <span className="flex items-center gap-1 text-orange-400">
                    Expires in {getTimeRemaining()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyUrl}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                title="Copy invite link"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video group"
                >
                  {participant.isVideoOn ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-purple-700">
                      <div className="w-32 h-32 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-5xl font-bold text-white">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                      <VideoOff className="w-16 h-16 text-gray-600" />
                    </div>
                  )}
                  
                  {/* Participant info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{participant.name}</span>
                      <div className="flex items-center gap-2">
                        {!participant.isAudioOn && (
                          <div className="p-1.5 bg-red-600 rounded-full">
                            <MicOff className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Placeholder for more participants */}
              {participants.length < 6 && (
                <div className="relative bg-gray-800 rounded-xl overflow-hidden aspect-video flex items-center justify-center border-2 border-dashed border-gray-700">
                  <div className="text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">Waiting for others...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="bg-gray-800 px-6 py-6 flex items-center justify-center gap-4 flex-shrink-0">
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all ${
                isAudioOn
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isAudioOn ? 'Mute' : 'Unmute'}
            >
              {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                isVideoOn
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
            >
              {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all ${
                isScreenSharing
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </button>

            <button
              onClick={handleLeave}
              className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all ml-4"
              title="Leave call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
