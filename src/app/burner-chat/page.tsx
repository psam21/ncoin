'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { BurnerChat } from '@/components/meetings/BurnerChat';
import { MeetingURLCreator } from '@/components/meetings/MeetingURLCreator';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Suspense } from 'react';
import { MessageSquare, Plus, Copy, Check } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  url: string;
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

function BurnerChatPageContent() {
  const searchParams = useSearchParams();
  const isHydrated = useAuthHydration();
  const { isAuthenticated } = useAuthStore();
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  React.useEffect(() => {
    const joinParam = searchParams?.get('join');
    if (joinParam) {
      const chat = chats.find(c => c.id === joinParam);
      if (chat) {
        setActiveChat(chat);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, chats]);

  const handleCreateChat = () => {
    setShowCreator(true);
  };

  const handleChatCreated = (config: MeetingConfig): { url: string; id: string } => {
    const chatId = Math.random().toString(36).substring(2, 15);
    const chatUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/burner-chat?join=${chatId}`
      : `https://example.com/burner-chat?join=${chatId}`;
    
    const expiresAt = config.expiresIn && config.expiresIn > 0
      ? new Date(Date.now() + config.expiresIn * 60 * 60 * 1000)
      : undefined;

    const newChat: Chat = {
      id: chatId,
      title: config.title,
      url: chatUrl,
      createdAt: new Date(),
      expiresAt,
    };

    setChats(prev => [newChat, ...prev]);
    setShowCreator(false);

    return {
      url: chatUrl,
      id: chatId,
    };
  };

  const handleJoinChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
    }
  };

  const handleCloseChat = () => {
    setActiveChat(null);
  };

  const handleCopyUrl = (url: string, chatId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(chatId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="text-center max-w-md px-6">
          <svg
            className="w-16 h-16 text-orange-600 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-orange-900 mb-2">
            Sign in to access Burner Chat
          </h2>
          <p className="text-orange-600 mb-6">
            Create and join temporary chat rooms
          </p>
          <a
            href="/signin"
            className="inline-block px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (activeChat) {
    return (
      <BurnerChat
        meetingId={activeChat.id}
        meetingTitle={activeChat.title}
        onClose={handleCloseChat}
        expiresAt={activeChat.expiresAt}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50">
      <div className="container-width section-padding">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-orange-800">Burner Chat</h1>
          <p className="text-purple-600 mt-2 font-medium">
            Create temporary chat rooms that auto-expire
          </p>
        </div>

        <button
          onClick={handleCreateChat}
          className="group mb-8 w-full md:w-auto relative overflow-hidden bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="flex items-center justify-center md:justify-start gap-4">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center group-hover:bg-opacity-30 transition-all">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-semibold">New Burner Chat</h3>
              <p className="text-sm text-orange-100">Create a temporary chat room</p>
            </div>
            <Plus className="w-6 h-6 opacity-50 group-hover:opacity-100 transition-opacity ml-auto" />
          </div>
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-purple-50">
            <h2 className="text-lg font-semibold text-orange-900">Your Chat Rooms</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {chats.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No chat rooms yet</h3>
                <p className="text-gray-600 text-sm">
                  Create your first burner chat using the button above
                </p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className="px-6 py-4 hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-orange-100 text-orange-600">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {chat.title}
                        </h3>
                        <div className="text-xs text-gray-500 mt-1">
                          Created {new Date(chat.createdAt).toLocaleTimeString()}
                          {chat.expiresAt && (
                            <span className="text-orange-600 ml-2">
                              • Expires {new Date(chat.expiresAt).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleCopyUrl(chat.url, chat.id)}
                        className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Copy chat URL"
                      >
                        {copiedId === chat.id ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleJoinChat(chat.id)}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
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

        {showCreator && (
          <MeetingURLCreator
            onCreateMeeting={handleChatCreated}
            onClose={() => setShowCreator(false)}
            meetingType="chat"
          />
        )}

        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-3">
            💬 About Burner Chats
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-0.5">•</span>
              <span>Temporary chat rooms with auto-expiration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-0.5">•</span>
              <span>No message history saved after expiration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-0.5">•</span>
              <span>Share via link - anyone can join</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-600 mt-0.5">•</span>
              <span>Perfect for quick, disposable conversations</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function BurnerChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-orange-600">Loading...</p>
        </div>
      </div>
    }>
      <BurnerChatPageContent />
    </Suspense>
  );
}
