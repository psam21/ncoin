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
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Messages</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    // If we have a selected pubkey (from URL), show it as a new conversation
    if (selectedPubkey) {
      return (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-purple-200">
            <h2 className="text-lg font-semibold text-purple-900 mb-3">Messages</h2>
            
            {/* Start New Conversation Input */}
            <div className="space-y-2">
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
                  className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                    npubError
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-purple-300 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                />
                <button
                  onClick={handleStartConversation}
                  disabled={!npubInput.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  title="Start conversation"
                >
                  <MessageSquarePlus size={18} />
                  <span className="hidden sm:inline text-sm">Start</span>
                </button>
              </div>
              {npubError && (
                <p className="text-xs text-red-600">{npubError}</p>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <button
              onClick={() => onSelectConversation(selectedPubkey)}
              className="w-full p-4 border-b border-gray-200 bg-purple-100 text-left hover:bg-purple-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Avatar placeholder */}
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {selectedPubkey[0]?.toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {formatPubkey(selectedPubkey)}
                  </h3>
                  <p className="text-sm text-gray-500 italic">
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
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Messages</h2>
          
          {/* Start New Conversation Input */}
          <div className="space-y-2">
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
                className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  npubError
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
                }`}
              />
              <button
                onClick={handleStartConversation}
                disabled={!npubInput.trim()}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                title="Start conversation"
              >
                <MessageSquarePlus size={18} />
                <span className="hidden sm:inline text-sm">Start</span>
              </button>
            </div>
            {npubError && (
              <p className="text-xs text-red-600">{npubError}</p>
            )}
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-3"
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
            <p className="text-gray-600 font-medium mb-1">No conversations yet</p>
            <p className="text-sm text-gray-500">
              Enter an npub above to start a conversation
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold mb-3">Messages</h2>
        
        {/* Start New Conversation Input */}
        <div className="space-y-2">
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
              className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                npubError
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-purple-500 focus:border-purple-500'
              }`}
            />
            <button
              onClick={handleStartConversation}
              disabled={!npubInput.trim()}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              title="Start conversation"
            >
              <MessageSquarePlus size={18} />
              <span className="hidden sm:inline text-sm">Start</span>
            </button>
          </div>
          {npubError && (
            <p className="text-xs text-red-600">{npubError}</p>
          )}
        </div>
        
        <p className="text-xs text-gray-500 mt-3">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {/* If selectedPubkey doesn't exist in conversations, show it first */}
        {selectedPubkey && !conversations.find(c => c.pubkey === selectedPubkey) && (
          <button
            onClick={() => handleSelect(selectedPubkey)}
            className="w-full p-4 border-b border-gray-200 bg-purple-100 text-left hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                <span className="text-white font-semibold text-sm">
                  {selectedPubkey[0]?.toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">
                  {formatPubkey(selectedPubkey)}
                </h3>
                <p className="text-sm text-gray-500 italic">
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
            className={`w-full p-4 border-b border-gray-200 hover:bg-purple-50 transition-colors text-left ${
              selectedPubkey === conversation.pubkey ? 'bg-purple-100' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {conversation.avatar ? (
                    <img 
                      src={conversation.avatar} 
                      alt={conversation.displayName || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-semibold text-sm">
                      {(conversation.displayName?.[0] || conversation.pubkey[0])?.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Name and timestamp */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="truncate font-medium">
                    {conversation.displayName || formatPubkey(conversation.pubkey)}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatTimestamp(conversation.lastMessageAt)}
                  </span>
                </div>

                {/* Context tag if present */}
                {conversation.context && (
                  <div className="mt-1 flex items-center gap-2">
                    {conversation.context.imageUrl && (
                      <img 
                        src={conversation.context.imageUrl} 
                        alt={conversation.context.title || 'Context'}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <span className="inline-block text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      {conversation.context.type === 'product' ? '🛍️' : '🏛️'} {conversation.context.title || conversation.context.id}
                    </span>
                  </div>
                )}
                
                {/* Pubkey */}
                <p className="text-xs text-gray-400 truncate font-mono mt-1">
                  {conversation.pubkey.slice(0, 16)}...
                </p>
              </div>
              
              {/* Unread badge */}
              {conversation.unreadCount && conversation.unreadCount > 0 && (
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full ml-2 mt-1">
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
