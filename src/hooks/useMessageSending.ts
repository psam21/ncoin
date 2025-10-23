/**
 * useMessageSending.ts
 * Hook Layer - Message Sending with Optimistic UI
 * 
 * Handles sending messages with optimistic updates and error handling.
 * Follows battle-tested Shop hook patterns.
 */

'use client';

import { useState, useCallback } from 'react';
import { logger } from '@/services/core/LoggingService';
import { messagingBusinessService } from '@/services/business/MessagingBusinessService';
import { Message, ConversationContext } from '@/types/messaging';
import { GenericAttachment } from '@/types/attachments';
import { useNostrSigner } from './useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

interface SendMessageOptions {
  /** Callback for optimistic UI update */
  onOptimisticUpdate?: (tempMessage: Message) => void;
  /** Callback when message is successfully sent */
  onSuccess?: (message: Message) => void;
  /** Callback when sending fails */
  onError?: (error: string, tempMessageId?: string) => void;
  /** Callback for upload progress (fileName, progress 0-100) */
  onUploadProgress?: (fileName: string, progress: number) => void;
}

export const useMessageSending = () => {
  const { signer } = useNostrSigner();
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  /**
   * Send a message with optimistic UI
   * 
   * @param recipientPubkey - Recipient's public key
   * @param content - Message content
   * @param attachments - Optional media attachments
   * @param context - Optional conversation context (product/heritage reference)
   * @param options - Callbacks for optimistic UI and error handling
   */
  const sendMessage = useCallback(async (
    recipientPubkey: string,
    content: string,
    attachments?: GenericAttachment[],
    context?: ConversationContext,
    options?: SendMessageOptions
  ) => {
    if (!signer) {
      const error = 'No signer detected. Please sign in.';
      logger.warn('Cannot send message without signer', {
        service: 'useMessageSending',
        method: 'sendMessage',
      });
      setSendError(error);
      options?.onError?.(error);
      return;
    }

    if (!content.trim() && (!attachments || attachments.length === 0)) {
      const error = 'Message must have content or attachments';
      logger.warn('Cannot send empty message without attachments', {
        service: 'useMessageSending',
        method: 'sendMessage',
      });
      setSendError(error);
      options?.onError?.(error);
      return;
    }

    try {
      logger.info('Sending message', {
        service: 'useMessageSending',
        method: 'sendMessage',
        recipientPubkey,
        hasContext: !!context,
        attachmentCount: attachments?.length || 0,
      });

      setIsSending(true);
      setSendError(null);

      // CRITICAL: Use authenticated user pubkey from auth store, never rely on signer alone
      const { user, isAuthenticated } = useAuthStore.getState();
      if (!isAuthenticated || !user) {
        throw new AppError(
          'User not authenticated. Please sign in.',
          ErrorCode.SIGNER_NOT_DETECTED,
          HttpStatus.UNAUTHORIZED,
          ErrorCategory.AUTHENTICATION,
          ErrorSeverity.HIGH
        );
      }

      const authPubkey = user.pubkey;

      // Integrity check: verify signer pubkey matches auth store
      try {
        const signerPubkey = await signer.getPublicKey();
        if (signerPubkey !== authPubkey) {
          logger.error('Signer pubkey mismatch on send - aborting to prevent identity confusion', new Error('Pubkey mismatch'), {
            service: 'useMessageSending',
            method: 'sendMessage',
            authPubkey: authPubkey.substring(0, 8) + '...',
            signerPubkey: signerPubkey.substring(0, 8) + '...',
            recipientPubkey,
          });
          throw new AppError(
            'Identity mismatch detected. Please sign in again.',
            ErrorCode.SIGNER_NOT_DETECTED,
            HttpStatus.UNAUTHORIZED,
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.HIGH
          );
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
        logger.error('Failed to verify signer identity before sending', err instanceof Error ? err : new Error('Unknown error'), {
          service: 'useMessageSending',
          method: 'sendMessage',
          recipientPubkey,
        });
        throw new AppError(
          'Failed to verify signing credentials. Please sign in again.',
          ErrorCode.SIGNER_NOT_DETECTED,
          HttpStatus.UNAUTHORIZED,
          ErrorCategory.AUTHENTICATION,
          ErrorSeverity.HIGH
        );
      }

      // Create temporary message for optimistic UI using authenticated pubkey
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      const tempMessage: Message = {
        id: '',
        tempId,
        senderPubkey: authPubkey,
        recipientPubkey,
        content,
        attachments,
        createdAt: Math.floor(Date.now() / 1000),
        context,
        isSent: true,
      };

      // Trigger optimistic update
      options?.onOptimisticUpdate?.(tempMessage);

      try {
        // Send message via business service
        const result = await messagingBusinessService.sendMessage(
          recipientPubkey,
          content,
          signer,
          attachments,
          context,
          options?.onUploadProgress // Forward upload progress callback
        );

        if (!result.success || !result.message) {
          throw new AppError(
            result.error || 'Failed to send message',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.EXTERNAL_SERVICE,
            ErrorSeverity.MEDIUM
          );
        }

        logger.info('Message sent successfully', {
          service: 'useMessageSending',
          method: 'sendMessage',
          messageId: result.message.id,
          tempId,
        });

        // Add tempId to the message so it can replace the optimistic one
        const messageWithTempId = {
          ...result.message,
          tempId,
        };

        // Trigger success callback
        options?.onSuccess?.(messageWithTempId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        logger.error('Failed to send message', err instanceof Error ? err : new Error(errorMessage), {
          service: 'useMessageSending',
          method: 'sendMessage',
          recipientPubkey,
        });
        
        setSendError(errorMessage);
        options?.onError?.(errorMessage, tempId);
      } finally {
        setIsSending(false);
      }
    } catch (err) {
      // Outer catch for signer.getPublicKey() and other early failures
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      logger.error('Failed to get signer or send message', err instanceof Error ? err : new Error(errorMessage), {
        service: 'useMessageSending',
        method: 'sendMessage',
        recipientPubkey,
      });
      setSendError(errorMessage);
      setIsSending(false);
    }
  }, [signer]);

  /**
   * Clear send error
   */
  const clearError = useCallback(() => {
    setSendError(null);
  }, []);

  return {
    sendMessage,
    isSending,
    sendError,
    clearError,
  };
};
