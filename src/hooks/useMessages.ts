
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { logger } from '@/services/core/LoggingService';
import { messagingBusinessService } from '@/services/business/MessagingBusinessService';
import { Message } from '@/types/messaging';
import { useNostrSigner } from './useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

interface UseMessagesProps {
  /** Public key of the other user in the conversation */
  otherPubkey: string | null;
  /** Maximum number of messages to load (default: 100) */
  limit?: number;
}

export const useMessages = ({ otherPubkey, limit = 100 }: UseMessagesProps) => {
  const { signer } = useNostrSigner();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track message IDs we've added via onSuccess to prevent subscription duplicates
  const recentlyAddedIds = useRef<Set<string>>(new Set());
  const currentUserPubkey = useRef<string | null>(null);

  /**
   * Load messages for the conversation
   */
  const loadMessages = useCallback(async () => {
    if (!signer) {
      logger.warn('No signer available', {
        service: 'useMessages',
        method: 'loadMessages',
      });
      const error = new AppError(
        'No signer detected. Please sign in.',
        ErrorCode.SIGNER_NOT_DETECTED,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM
      );
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (!otherPubkey) {
      logger.debug('No other pubkey provided, skipping load', {
        service: 'useMessages',
        method: 'loadMessages',
      });
      setMessages([]);
      setIsLoading(false);
      return;
    }

    try {
      // CRITICAL: Use authenticated user pubkey strictly from auth store to avoid extension-based identity switching
      const { isAuthenticated, user } = useAuthStore.getState();
      if (!isAuthenticated || !user) {
        logger.warn('Aborting loadMessages - user not authenticated', {
          service: 'useMessages',
          method: 'loadMessages',
        });
        setMessages([]);
        setIsLoading(false);
        return;
      }

      const authPubkey = user.pubkey;

      if (currentUserPubkey.current && currentUserPubkey.current !== authPubkey) {
        logger.info('Auth user changed - clearing message state', {
          service: 'useMessages',
          method: 'loadMessages',
          oldUser: currentUserPubkey.current.substring(0, 8) + '...',
          newUser: authPubkey.substring(0, 8) + '...',
        });
        recentlyAddedIds.current.clear();
        setMessages([]);
      }
      currentUserPubkey.current = authPubkey;

      logger.info('Loading messages for conversation', {
        service: 'useMessages',
        method: 'loadMessages',
        otherPubkey,
        limit,
      });

      setIsLoading(true);
      setError(null);

      const messageList = await messagingBusinessService.getMessages(
        otherPubkey,
        signer,
        limit,
        authPubkey
      );

      logger.info('Messages loaded successfully', {
        service: 'useMessages',
        method: 'loadMessages',
        count: messageList.length,
        otherPubkey,
      });

      // Set messages directly - when switching conversations, we want a fresh start
      // Only merge messages if they're for the SAME conversation (by checking pubkeys match)
      setMessages(prev => {
        // Check if previous messages are for the same conversation
        const isSameConversation = prev.length === 0 || prev.every(msg => 
          (msg.senderPubkey === otherPubkey || msg.recipientPubkey === otherPubkey)
        );
        
        if (!isSameConversation) {
          // Different conversation - replace entirely
          logger.debug('Switching conversations - replacing messages', {
            service: 'useMessages',
            method: 'loadMessages',
            previousCount: prev.length,
            loadedCount: messageList.length,
            otherPubkey,
          });
          return messageList.sort((a, b) => a.createdAt - b.createdAt);
        }
        
        // Same conversation - merge to preserve optimistic updates
        const messageMap = new Map<string, Message>();
        
        // Helper to get consistent key for a message
        const getKey = (msg: Message) => {
          if (msg.id) return `id:${msg.id}`;
          if (msg.tempId) return `temp:${msg.tempId}`;
          return `fallback:${msg.senderPubkey}-${msg.recipientPubkey}-${msg.createdAt}`;
        };
        
        logger.debug('Merging messages for same conversation', {
          service: 'useMessages',
          method: 'loadMessages',
          previousCount: prev.length,
          loadedCount: messageList.length,
        });
        
        // First, add all previously loaded/sent messages from this session
        prev.forEach(msg => {
          messageMap.set(getKey(msg), msg);
        });
        
        // Then add newly loaded messages from relays
        messageList.forEach(msg => {
          const key = getKey(msg);
          
          // Only add if not already present OR if this is a real message replacing a temp one
          if (!messageMap.has(key)) {
            messageMap.set(key, msg);
          } else if (msg.id && !messageMap.get(key)!.id) {
            // Replace temp/fallback with real message
            messageMap.set(key, msg);
          }
        });
        
        const mergedMessages = Array.from(messageMap.values()).sort((a, b) => a.createdAt - b.createdAt);
        
        logger.debug('Messages merged', {
          service: 'useMessages',
          method: 'loadMessages',
          finalCount: mergedMessages.length,
        });
        
        return mergedMessages;
      });
    } catch (err) {
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to load messages',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.EXTERNAL_SERVICE,
            ErrorSeverity.MEDIUM
          );
      logger.error('Failed to load messages', appError, {
        service: 'useMessages',
        method: 'loadMessages',
        otherPubkey,
      });
      setError(appError.message);
    } finally {
      setIsLoading(false);
    }
  }, [signer, otherPubkey, limit]);

  /**
   * Add a new message to the conversation (for real-time updates or optimistic UI)
   */
  const addMessage = useCallback((message: Message, source: 'subscription' | 'cache' | 'optimistic' = 'subscription') => {
    setMessages(prev => {
      // Create a map to track existing messages
      const messageMap = new Map<string, Message>();
      
      // Helper to get consistent key for a message
      const getKey = (msg: Message) => {
        if (msg.id) return `id:${msg.id}`;
        if (msg.tempId) return `temp:${msg.tempId}`;
        return `fallback:${msg.senderPubkey}-${msg.recipientPubkey}-${msg.createdAt}`;
      };
      
      // First, add all existing messages
      prev.forEach(msg => {
        messageMap.set(getKey(msg), msg);
      });
      
      // Check if this message already exists by ID
      const messageKey = getKey(message);
      
      // DETAILED LOGGING TO DEBUG DUPLICATES
      logger.info('🔍 addMessage called', {
        service: 'useMessages',
        method: 'addMessage',
        messageId: message.id?.substring(0, 8),
        tempId: message.tempId,
        messageKey,
        source,
        prevCount: prev.length,
        mapSize: messageMap.size,
        hasInMap: messageMap.has(messageKey),
        existingKeys: Array.from(messageMap.keys()).map(k => k.substring(0, 20)),
      });
      
      if (message.id && messageMap.has(messageKey)) {
        // Message with this ID already exists - don't add duplicate
        logger.warn('❌ DUPLICATE DETECTED - Message with this ID already exists, skipping', {
          service: 'useMessages',
          method: 'addMessage',
          messageId: message.id,
          tempId: message.tempId,
          messageKey,
          source,
        });
        return prev;
      }
      
      // Track this message ID immediately when added from cache/optimistic
      // This MUST happen before subscription can add it as duplicate
      if (message.id && source !== 'subscription') {
        recentlyAddedIds.current.add(message.id);
        logger.info('📌 Tracking message ID to prevent subscription duplicate', {
          service: 'useMessages',
          method: 'addMessage',
          messageId: message.id?.substring(0, 8),
          source,
        });
        // Clear after 10 seconds to prevent memory leak
        setTimeout(() => {
          recentlyAddedIds.current.delete(message.id!);
          logger.debug('🗑️ Removed message ID from tracking', {
            service: 'useMessages',
            method: 'addMessage',
            messageId: message.id?.substring(0, 8),
          });
        }, 10000);
      }
      
      // Check if it's a duplicate by tempId
      const isDuplicate = messageMap.has(messageKey);
      
      if (isDuplicate) {
        // Update existing message (e.g., replace tempId with real id)
        logger.debug('Updating existing message', {
          service: 'useMessages',
          method: 'addMessage',
          messageId: message.id,
          tempId: message.tempId,
        });
        messageMap.set(messageKey, message);
      } else {
        // New message - check if it replaces a temp message
        if (message.id) {
          // Look for temp version by matching tempId OR by sender/recipient/timestamp
          if (message.tempId) {
            // We have explicit tempId - remove that temp message
            const tempKey = `temp:${message.tempId}`;
            if (messageMap.has(tempKey)) {
              logger.debug('Replacing temp message with real message (by tempId)', {
                service: 'useMessages',
                method: 'addMessage',
                tempId: message.tempId,
                realId: message.id,
              });
              messageMap.delete(tempKey);
            }
          } else {
            // No tempId (probably from subscription) - find temp by matching sender/time/content
            // This handles the case where subscription arrives before onSuccess
            // BUT: Only match if source is subscription AND we haven't tracked this ID yet
            // (prevents replacing temp with wrong duplicate message)
            const shouldAttemptMatch = source === 'subscription' && !recentlyAddedIds.current.has(message.id);
            
            if (shouldAttemptMatch) {
              let foundMatch = false;
              prev.forEach(prevMsg => {
                if (foundMatch) return; // Only replace first match
              
              if (prevMsg.tempId && 
                  !prevMsg.id &&
                  prevMsg.senderPubkey === message.senderPubkey &&
                  prevMsg.recipientPubkey === message.recipientPubkey) {
                // Additional check: content should match (allowing for imeta tags)
                // Strip imeta tags from both for comparison
                // Regex matches: \n\n[Attachment N]\nurl ... (all on one line)
                // Use simpler approach: remove everything from first \n\n[Attachment onwards
                const cleanContent = (content: string) => {
                  const firstAttachment = content.indexOf('\n\n[Attachment');
                  return firstAttachment >= 0 ? content.substring(0, firstAttachment).trim() : content.trim();
                };
                const prevContent = cleanContent(prevMsg.content);
                const newContent = cleanContent(message.content);
                
                // Content must match exactly (both empty is a match for photo-only messages)
                const contentMatches = prevContent === newContent;
                
                // Additional check: attachment count should be similar
                const prevAttachmentCount = prevMsg.attachments?.length || 0;
                const newAttachmentCount = message.attachments?.length || 0;
                const attachmentCountMatches = prevAttachmentCount === newAttachmentCount || 
                                              (prevAttachmentCount > 0 && newAttachmentCount > 0);
                
                // Time check: message.createdAt should be >= prevMsg.createdAt (can't be sent before temp was created)
                // Allow up to 30 seconds for media upload delays
                const timeDiff = message.createdAt - prevMsg.createdAt;
                const timeIsValid = timeDiff >= 0 && timeDiff < 30;
                
                logger.info('Checking temp message match', {
                  service: 'useMessages',
                  method: 'addMessage',
                  tempId: prevMsg.tempId,
                  realId: message.id,
                  prevCreatedAt: prevMsg.createdAt,
                  newCreatedAt: message.createdAt,
                  timeDiff,
                  timeIsValid,
                  prevContent,
                  newContent,
                  contentMatches,
                  prevAttachmentCount,
                  newAttachmentCount,
                  attachmentCountMatches,
                });
                
                if (contentMatches && attachmentCountMatches && timeIsValid) {
                  logger.info('✅ Replacing temp message with real message', {
                    service: 'useMessages',
                    method: 'addMessage',
                    tempId: prevMsg.tempId,
                    realId: message.id,
                    timeDiff,
                  });
                  messageMap.delete(`temp:${prevMsg.tempId}`);
                  foundMatch = true;
                } else {
                  logger.warn('❌ Temp message did not match - keeping as separate message', {
                    service: 'useMessages',
                    method: 'addMessage',
                    tempId: prevMsg.tempId,
                    realId: message.id,
                    reason: !contentMatches ? 'content mismatch' : 
                           !attachmentCountMatches ? 'attachment count mismatch' : 
                           'time validation failed',
                  });
                }
              }
            });
            } // Close shouldAttemptMatch block
          }
        }
        
        // Add the new message
        logger.debug('Adding new message', {
          service: 'useMessages',
          method: 'addMessage',
          messageId: message.id,
          tempId: message.tempId,
          hasTempId: !!message.tempId,
        });
        messageMap.set(messageKey, message);
      }
      
      // Sort by timestamp and return
      return Array.from(messageMap.values()).sort((a, b) => a.createdAt - b.createdAt);
    });
  }, []);

  /**
   * Remove a message (e.g., if sending failed)
   */
  const removeMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId && m.tempId !== messageId));
  }, []);

  /**
   * Subscribe to new messages for this conversation
   */
  useEffect(() => {
    if (!signer || !otherPubkey) return;

    const { user } = useAuthStore.getState();
    if (!user) return; // Not authenticated, skip subscription

    logger.info('Setting up message subscription for conversation', {
      service: 'useMessages',
      method: 'useEffect[subscribe]',
      otherPubkey,
    });

    const unsubscribe = messagingBusinessService.subscribeToMessages(
      signer,
      (message: Message) => {
        // Only add message if it's part of this conversation
        if (
          (message.senderPubkey === otherPubkey || message.recipientPubkey === otherPubkey)
        ) {
          // Skip if we just added this message via cache/optimistic update
          if (message.id && recentlyAddedIds.current.has(message.id)) {
            logger.info('⏭️ Skipping message - already added via cache/optimistic', {
              service: 'useMessages',
              method: 'messageCallback',
              messageId: message.id?.substring(0, 8),
              otherPubkey,
            });
            return;
          }
          
          logger.info('New message received for conversation', {
            service: 'useMessages',
            method: 'messageCallback',
            messageId: message.id?.substring(0, 8),
            otherPubkey,
          });
          
          addMessage(message, 'subscription');
        }
      },
      user.pubkey // Pass authenticated pubkey for subscription
    );

    return () => {
      logger.info('Cleaning up message subscription', {
        service: 'useMessages',
        method: 'useEffect[cleanup]',
        otherPubkey,
      });
      unsubscribe();
    };
  }, [signer, otherPubkey, addMessage]);

  /**
   * Load messages when otherPubkey changes
   */
  useEffect(() => {
    // Only load messages when otherPubkey changes or on initial mount
    // Don't reload if we're just updating messages in the same conversation
    if (otherPubkey) {
      loadMessages();
    } else {
      setMessages([]);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otherPubkey]); // Only depend on otherPubkey, not loadMessages

  /**
   * Refresh messages manually
   */
  const refreshMessages = useCallback(() => {
    logger.info('Refreshing messages', {
      service: 'useMessages',
      method: 'refreshMessages',
      otherPubkey,
    });
    loadMessages();
  }, [loadMessages, otherPubkey]);

  return {
    messages,
    isLoading,
    error,
    refreshMessages,
    addMessage,
    removeMessage,
  };
};
