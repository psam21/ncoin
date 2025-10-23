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

  // Debug logging
  useEffect(() => {
    console.log('MessageThread - Current state:', {
      currentUserPubkey,
      otherUserPubkey,
      messageCount: messages.length,
      messages: messages.map(m => ({
        senderPubkey: m.senderPubkey,
        recipientPubkey: m.recipientPubkey,
        isSent: m.isSent,
        content: m.content.substring(0, 30),
        createdAt: m.createdAt,
      })),
    });
  }, [messages, currentUserPubkey, otherUserPubkey]);

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
      <div className="flex-1 flex items-center justify-center bg-purple-50">
        <div className="text-center px-6">
          <svg
            className="w-16 h-16 text-purple-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            Select a conversation
          </h3>
          <p className="text-purple-600">
            Choose a conversation from the list to view messages
          </p>
        </div>
      </div>
    );
  }

  // Get conversation display name (simplified - could be enhanced with profile lookup)
  const displayName = otherUserPubkey.substring(0, 8) + '...' + otherUserPubkey.substring(otherUserPubkey.length - 4);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-purple-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center px-6">
          <svg
            className="w-12 h-12 text-purple-400 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <p className="text-purple-600 font-medium mb-1">No messages yet</p>
          <p className="text-sm text-purple-500">
            Start the conversation by sending a message below
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile header with back button */}
      {showMobileHeader && onBack && (
        <div className="bg-white border-b border-purple-200 px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 hover:bg-purple-100 rounded-lg transition-colors"
            aria-label="Back to conversations"
          >
            <svg
              className="w-6 h-6 text-purple-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-purple-900 truncate">
              {displayName}
            </h2>
          </div>
        </div>
      )}

      {/* Messages container */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
      {messages.map((message) => {
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
            className={`flex ${isSent ? 'justify-end' : 'justify-start'} mb-4`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                isSent
                  ? 'bg-purple-600 text-white rounded-br-sm'
                  : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
              }`}
            >
              {/* Message content */}
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.content}
              </p>

              {/* Media attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div key={attachment.id}>
                      {attachment.type === 'image' && (
                        <>
                          {attachment.url ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="max-w-full rounded-lg max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
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
              <div className={`flex items-center gap-1 mt-1 text-xs ${
                isSent ? 'text-purple-100 justify-end' : 'text-gray-500'
              }`}>
                <span>{formatDistanceToNow(new Date(message.createdAt * 1000), { addSuffix: true })}</span>
                {isSent && (
                  <span className="ml-1">
                    {message.id && !message.tempId ? (
                      <CheckCheck className="h-3 w-3 text-purple-200" />
                    ) : message.tempId && !message.id ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <CheckCheck className="h-3 w-3" />
                    )}
                  </span>
                )}
                {message.tempId && !message.id && (
                  <span className="ml-1">Sending...</span>
                )}
              </div>

              {/* Context tag if present */}
              {message.context && (
                <div className="mt-2 pt-2 border-t border-opacity-20" style={{ borderColor: isSent ? 'white' : '#cbd5e0' }}>
                  <p className={`text-xs ${isSent ? 'text-purple-100' : 'text-gray-600'}`}>
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
          className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4"
          onClick={() => setFullscreenImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full transition-colors"
            aria-label="Close fullscreen"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          {/* Fullscreen image */}
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.alt}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
