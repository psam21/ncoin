/**
 * MessageThread.tsx
 * Component Layer - Message Thread Display
 * 
 * Displays message history for a conversation.
 * Follows battle-tested Shop component patterns.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Message } from '@/types/messaging';
import { X, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageThreadProps {
  messages: Message[];
  currentUserPubkey: string | null;
  otherUserPubkey: string | null;
  isLoading?: boolean;
  onBack?: () => void;
  showMobileHeader?: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages,
  currentUserPubkey,
  otherUserPubkey,
  isLoading,
  onBack,
  showMobileHeader = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; alt: string } | null>(null);

  // Auto-scroll to bottom when new messages arrive (only within the messages container)
  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  // Scroll to bottom when conversation changes (opening a conversation)
  useEffect(() => {
    if (otherUserPubkey && messagesContainerRef.current && messagesEndRef.current) {
      // Immediate scroll (no smooth animation) when opening conversation
      messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'end' });
    }
  }, [otherUserPubkey]);

  if (!otherUserPubkey) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center px-8 max-w-md">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <svg
              className="w-12 h-12 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-500 leading-relaxed">
            Choose a conversation from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  // Get conversation display name (simplified - could be enhanced with profile lookup)
  const displayName = otherUserPubkey.substring(0, 8) + '...' + otherUserPubkey.substring(otherUserPubkey.length - 4);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 font-medium">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center px-8 max-w-sm">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
            <svg
              className="w-10 h-10 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Send a message below to start the conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Mobile header with back button */}
      {showMobileHeader && onBack && (
        <div className="bg-white border-b border-gray-200 px-3 py-3 flex items-center gap-2 shadow-sm sticky top-0 z-10">
          <button
            onClick={onBack}
            className="p-2 -ml-1 hover:bg-gray-100 active:bg-gray-200 rounded-full transition-colors"
            aria-label="Back to conversations"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {displayName}
            </h2>
          </div>
        </div>
      )}

      {/* Messages container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6 space-y-3">{messages.map((message) => {
        // Use the isSent flag from the message (already set by business service)
        const isSent = message.isSent ?? (message.senderPubkey === currentUserPubkey);
        
        // Create unique key that combines id, tempId, and timestamp
        // This ensures React treats each message as unique even during temp->real transition
        const uniqueKey = message.id 
          ? `id-${message.id}` 
          : message.tempId 
            ? `temp-${message.tempId}` 
            : `fallback-${message.senderPubkey}-${message.createdAt}`;

        return (
          <div
            key={uniqueKey}
            className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                isSent
                  ? 'bg-purple-600 text-white rounded-br-md'
                  : 'bg-white text-gray-900 border border-gray-100 rounded-bl-md'
              }`}
            >
              {/* Message content */}
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>

              {/* Media attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {attachment.type === 'image' && (
                        <>
                          {attachment.url ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="max-w-full rounded-xl max-h-80 object-contain cursor-pointer hover:opacity-95 transition-all shadow-md"
                              onClick={() => setFullscreenImage({ url: attachment.url!, alt: attachment.name })}
                            />
                          ) : attachment.originalFile ? (
                            <div className="max-w-full rounded-lg max-h-64 bg-purple-100 flex items-center justify-center p-8">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
                                <p className="text-sm text-purple-600">Uploading {attachment.name}...</p>
                              </div>
                            </div>
                          ) : null}
                        </>
                      )}
                      {attachment.type === 'video' && attachment.url && (
                        <video
                          src={attachment.url}
                          controls
                          className="max-w-full rounded-lg max-h-64"
                        >
                          Your browser does not support video playback.
                        </video>
                      )}
                      {attachment.type === 'audio' && attachment.url && (
                        <audio
                          src={attachment.url}
                          controls
                          className="w-full"
                        >
                          Your browser does not support audio playback.
                        </audio>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Timestamp with read receipts */}
              <div className={`flex items-center gap-1.5 mt-2 text-xs ${
                isSent ? 'text-purple-100 justify-end' : 'text-gray-500'
              }`}>
                <span className="font-medium">{formatDistanceToNow(new Date(message.createdAt * 1000), { addSuffix: true })}</span>
                {isSent && (
                  <span className="flex-shrink-0">
                    {message.id && !message.tempId ? (
                      <CheckCheck className="h-3.5 w-3.5 text-purple-200" />
                    ) : message.tempId && !message.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <CheckCheck className="h-3.5 w-3.5" />
                    )}
                  </span>
                )}
                {message.tempId && !message.id && (
                  <span className="text-xs opacity-75">Sending...</span>
                )}
              </div>

              {/* Context tag if present */}
              {message.context && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: isSent ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }}>
                  <p className={`text-xs font-medium ${isSent ? 'text-purple-100' : 'text-gray-600'}`}>
                    {message.context.type === 'product' ? '🛍️ Product' : '🏛️ Heritage'}: {message.context.title || message.context.id}
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
      </div>

      {/* Fullscreen Image Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setFullscreenImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-full transition-all shadow-lg"
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Fullscreen image */}
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.alt}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
