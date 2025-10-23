/**
 * ConversationList.tsx
 * Component Layer - Conversation List Display
 * 
 * Displays list of conversations with last message preview.
 * Follows battle-tested Shop component patterns.
 */

'use client';

import React, { useState } from 'react';
import { Conversation } from '@/types/messaging';
import { logger } from '@/services/core/LoggingService';
import { decodeNpub } from '@/utils/keyManagement';
import { MessageSquarePlus } from 'lucide-react';

interface ConversationListProps {
  conversations: Conversation[];
  selectedPubkey: string | null;
  onSelectConversation: (pubkey: string) => void;
  isLoading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedPubkey,
  onSelectConversation,
  isLoading = false,
}) => {
  const [npubInput, setNpubInput] = useState('');
  const [npubError, setNpubError] = useState('');

  const handleSelect = (pubkey: string) => {
    logger.info('Conversation selected', {
      service: 'ConversationList',
      method: 'handleSelect',
      pubkey,
    });
    onSelectConversation(pubkey);
  };

  const handleStartConversation = () => {
    setNpubError('');
    const input = npubInput.trim();
    
    if (!input) {
      setNpubError('Please enter an npub');
      return;
    }

    try {
      // Try to decode the npub
      const pubkey = decodeNpub(input);
      
      // Check if conversation already exists
      const existingConversation = conversations.find(c => c.pubkey === pubkey);
      
      if (existingConversation) {
        logger.info('Selecting existing conversation from npub input', {
          service: 'ConversationList',
          method: 'handleStartConversation',
          npub: input,
          pubkey: pubkey.substring(0, 8) + '...',
          status: 'existing',
        });
      } else {
        logger.info('Starting new conversation from npub input', {
          service: 'ConversationList',
          method: 'handleStartConversation',
          npub: input,
          pubkey: pubkey.substring(0, 8) + '...',
          status: 'new',
        });
      }

      // Select conversation (works for both existing and new)
      onSelectConversation(pubkey);
      
      // Clear input
      setNpubInput('');
    } catch (error) {
      logger.error('Invalid npub entered', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'ConversationList',
        method: 'handleStartConversation',
        input,
      });
      setNpubError('Invalid npub format. Please enter a valid npub1... address');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartConversation();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPubkey = (pubkey: string) => {
    // Format as npub1...xyz (first 8 and last 4 chars)
    if (pubkey.length > 12) {
      return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 4)}`;
    }
    return pubkey;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-gray-500 font-medium">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    // If we have a selected pubkey (from URL), show it as a new conversation
    if (selectedPubkey) {
      return (
        <div className="flex flex-col h-full bg-white">
          <div className="px-4 py-3 border-b border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
            
            {/* Start New Conversation Input */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={npubInput}
                  onChange={(e) => {
                    setNpubInput(e.target.value);
                    setNpubError('');
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter npub to start chat..."
                  className={`flex-1 px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                    npubError
                      ? 'border-red-300 focus:ring-red-400 focus:border-red-400 bg-red-50'
                      : 'border-gray-300 focus:ring-purple-400 focus:border-purple-400 bg-gray-50 hover:bg-white'
                  }`}
                />
                <button
                  onClick={handleStartConversation}
                  disabled={!npubInput.trim()}
                  className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all flex items-center gap-2 whitespace-nowrap font-semibold text-sm shadow-md hover:shadow-lg"
                  title="Start conversation"
                >
                  <MessageSquarePlus size={20} strokeWidth={2.5} />
                  <span className="hidden sm:inline">Start</span>
                </button>
              </div>
              {npubError && (
                <p className="text-xs text-red-600 font-medium pl-1">{npubError}</p>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <button
              onClick={() => onSelectConversation(selectedPubkey)}
              className="w-full px-4 py-3.5 border-b border-gray-100 bg-white hover:bg-purple-50 active:bg-purple-100 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <span className="text-white font-bold text-lg">
                    {selectedPubkey[0]?.toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate text-base">
                    {formatPubkey(selectedPubkey)}
                  </h3>
                  <p className="text-sm text-gray-500 italic mt-0.5">
                    Start a new conversation
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // No conversations and no selected recipient
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="px-4 py-3 border-b border-gray-200 shadow-sm bg-white">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
          
          {/* Start New Conversation Input */}
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                value={npubInput}
                onChange={(e) => {
                  setNpubInput(e.target.value);
                  setNpubError('');
                }}
                onKeyDown={handleKeyDown}
                placeholder="Enter npub to start chat..."
                className={`flex-1 px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  npubError
                    ? 'border-red-300 focus:ring-red-400 focus:border-red-400 bg-red-50'
                    : 'border-gray-300 focus:ring-purple-400 focus:border-purple-400 bg-gray-50 hover:bg-white'
                }`}
              />
              <button
                onClick={handleStartConversation}
                disabled={!npubInput.trim()}
                className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all flex items-center gap-2 whitespace-nowrap font-semibold text-sm shadow-md hover:shadow-lg"
                title="Start conversation"
              >
                <MessageSquarePlus size={20} strokeWidth={2.5} />
                <span className="hidden sm:inline">Start</span>
              </button>
            </div>
            {npubError && (
              <p className="text-xs text-red-600 font-medium pl-1">{npubError}</p>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
          <div className="text-center max-w-xs">
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Start a conversation by entering an npub address above
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 shadow-sm bg-white sticky top-0 z-10">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
        
        {/* Start New Conversation Input */}
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={npubInput}
              onChange={(e) => {
                setNpubInput(e.target.value);
                setNpubError('');
              }}
              onKeyDown={handleKeyDown}
              placeholder="Enter npub to start chat..."
              className={`flex-1 px-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                npubError
                  ? 'border-red-300 focus:ring-red-400 focus:border-red-400 bg-red-50'
                  : 'border-gray-300 focus:ring-purple-400 focus:border-purple-400 bg-gray-50 hover:bg-white'
              }`}
            />
            <button
              onClick={handleStartConversation}
              disabled={!npubInput.trim()}
              className="px-5 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 transition-all flex items-center gap-2 whitespace-nowrap font-semibold text-sm shadow-md hover:shadow-lg"
              title="Start conversation"
            >
              <MessageSquarePlus size={20} strokeWidth={2.5} />
              <span className="hidden sm:inline">Start</span>
            </button>
          </div>
          {npubError && (
            <p className="text-xs text-red-600 font-medium pl-1">{npubError}</p>
          )}
        </div>
        
        <p className="text-xs text-gray-500 font-medium mt-4">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        {/* If selectedPubkey doesn't exist in conversations, show it first */}
        {selectedPubkey && !conversations.find(c => c.pubkey === selectedPubkey) && (
          <button
            onClick={() => handleSelect(selectedPubkey)}
            className="w-full px-4 py-3.5 border-b border-gray-100 bg-purple-100 hover:bg-purple-50 active:bg-purple-200 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="text-white font-bold text-lg">
                  {selectedPubkey[0]?.toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-base">
                  {formatPubkey(selectedPubkey)}
                </h3>
                <p className="text-sm text-gray-500 italic mt-0.5">
                  Start a new conversation
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Existing conversations */}
        {conversations.map((conversation) => (
          <button
            key={conversation.pubkey}
            onClick={() => handleSelect(conversation.pubkey)}
            className={`w-full px-4 py-3.5 border-b border-gray-100 hover:bg-purple-50 active:bg-purple-100 transition-all text-left group ${
              selectedPubkey === conversation.pubkey ? 'bg-purple-100 shadow-inner' : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center overflow-hidden shadow-md transition-transform group-hover:scale-105 ${
                  conversation.avatar ? 'bg-gray-200' : 'bg-gradient-to-br from-purple-500 to-purple-700'
                }`}>
                  {conversation.avatar ? (
                    <img 
                      src={conversation.avatar} 
                      alt={conversation.displayName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {(conversation.displayName?.[0] || conversation.pubkey[0])?.toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Unread indicator dot */}
                {(conversation.unreadCount ?? 0) > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-purple-600 rounded-full border-2 border-white shadow-md flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{conversation.unreadCount! > 9 ? '9+' : conversation.unreadCount}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name and timestamp */}
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <h3 className="truncate font-semibold text-gray-900 text-base">
                    {conversation.displayName || formatPubkey(conversation.pubkey)}
                  </h3>
                  <span className={`text-xs whitespace-nowrap font-medium ${
                    conversation.unreadCount && conversation.unreadCount > 0 ? 'text-purple-600' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(conversation.lastMessageAt)}
                  </span>
                </div>

                {/* Context tag if present */}
                {conversation.context && (
                  <div className="flex items-center gap-2 mb-1.5">
                    {conversation.context.imageUrl && (
                      <img 
                        src={conversation.context.imageUrl} 
                        alt={conversation.context.title || 'Context'}
                        className="w-8 h-8 rounded object-cover flex-shrink-0 shadow-sm"
                      />
                    )}
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-md font-medium border border-purple-100">
                      <span>{conversation.context.type === 'product' ? '🛍️' : '🏛️'}</span>
                      <span className="truncate max-w-[120px]">{conversation.context.title || conversation.context.id}</span>
                    </span>
                  </div>
                )}
                
                {/* Last message preview or pubkey */}
                {conversation.lastMessage ? (
                  <p className={`text-sm truncate ${
                    conversation.unreadCount && conversation.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                  }`}>
                    {typeof conversation.lastMessage === 'string' ? conversation.lastMessage : conversation.lastMessage.content}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 truncate font-mono">
                    {conversation.pubkey.slice(0, 24)}...
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
