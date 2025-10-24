
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { CacheEncryptionService } from '../core/CacheEncryptionService';
import type { Message, Conversation } from '@/types/messaging';

interface MessageCacheDB extends DBSchema {
  messages: {
    key: string; // messageId
    value: {
      id: string;
      conversationId: string; // pubkey of other user
      ciphertext: string;     // Encrypted message object
      iv: string;             // Initialization vector
      timestamp: number;      // Message timestamp
      cachedAt: number;       // When it was cached
    };
    indexes: {
      'by-conversation': string;
      'by-timestamp': number;
      'by-cached-at': number;
    };
  };
  conversations: {
    key: string; // pubkey
    value: {
      pubkey: string;
      ciphertext: string; // Encrypted conversation object
      iv: string;
      lastMessageTime: number;
      unreadCount: number;
      lastReadTimestamp?: number;
      cachedAt: number;
    };
    indexes: {
      'by-lastMessage': number;
      'by-cached-at': number;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: string | number | boolean;
    };
  };
}

const DB_VERSION = 1;
const CACHE_TTL_DAYS = 30; // Auto-delete cached data older than 30 days

export class MessageCacheService {
  private db: IDBPDatabase<MessageCacheDB> | null = null;
  private encryption: CacheEncryptionService;
  private currentUserPubkey: string | null = null; // Track current user for DB isolation
  private static instance: MessageCacheService;
  
  // In-memory cache for decrypted messages (per session)
  private decryptedMessagesCache: Map<string, Message[]> = new Map();
  private decryptedConversationsCache: Map<string, Conversation> = new Map();

  private constructor() {
    this.encryption = CacheEncryptionService.getInstance();
  }

  static getInstance(): MessageCacheService {
    if (!MessageCacheService.instance) {
      MessageCacheService.instance = new MessageCacheService();
    }
    return MessageCacheService.instance;
  }

  /**
   * Initialize database and encryption key
   * Call this once on user login
   * 
   * @param pubkey - User's Nostr public key (hex format)
   */
  async initialize(pubkey: string): Promise<void> {
    try {
      // Close existing database if user changed
      if (this.currentUserPubkey && this.currentUserPubkey !== pubkey && this.db) {
        console.log('🔄 User changed, closing previous database', {
          oldUser: this.currentUserPubkey.substring(0, 8) + '...',
          newUser: pubkey.substring(0, 8) + '...',
        });
        this.db.close();
        this.db = null;
        this.decryptedMessagesCache.clear();
        this.decryptedConversationsCache.clear();
      }

      // Set current user
      this.currentUserPubkey = pubkey;

      // Initialize encryption key
      await this.encryption.initializeKey(pubkey);

      // Create user-specific database name to ensure complete isolation
      const userDbName = `nostr-messages-${pubkey.substring(0, 16)}`;
      console.log('📂 Opening user-specific database', {
        user: pubkey.substring(0, 8) + '...',
        dbName: userDbName,
      });

      // Open/create database
      this.db = await openDB<MessageCacheDB>(userDbName, DB_VERSION, {
        upgrade(db) {
          // Messages store
          if (!db.objectStoreNames.contains('messages')) {
            const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
            messageStore.createIndex('by-conversation', 'conversationId');
            messageStore.createIndex('by-timestamp', 'timestamp');
            messageStore.createIndex('by-cached-at', 'cachedAt');
          }

          // Conversations store
          if (!db.objectStoreNames.contains('conversations')) {
            const convoStore = db.createObjectStore('conversations', { keyPath: 'pubkey' });
            convoStore.createIndex('by-lastMessage', 'lastMessageTime');
            convoStore.createIndex('by-cached-at', 'cachedAt');
          }

          // Metadata store
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        }
      });

      console.log('✅ Message cache initialized');

      // Run migrations
      await this.runMigrations(pubkey);

      // Cleanup old cached data
      await this.cleanupOldCache();
    } catch (error) {
      console.error('❌ Failed to initialize message cache:', error);
      throw error;
    }
  }

  /**
   * Check if cache is initialized
   */
  isInitialized(): boolean {
    const dbReady = this.db !== null;
    const encryptionReady = this.encryption.isInitialized();
    const isReady = dbReady && encryptionReady;
    
    console.log('[Cache] 🔍 isInitialized check:', { 
      dbReady, 
      encryptionReady, 
      isReady 
    });
    
    return isReady;
  }

  /**
   * Cache multiple messages
   * Invalidates in-memory cache for affected conversations
   */
  async cacheMessages(messages: Message[]): Promise<void> {
    if (!this.db) {
      console.warn('⚠️ Cache not initialized, skipping cacheMessages');
      return;
    }

    // Track which conversations are affected
    const affectedConversations = new Set<string>();

    // Encrypt all messages first, before opening transaction
    const encryptedMessages = await Promise.all(
      messages.map(async (message) => {
        try {
          const { ciphertext, iv } = await this.encryption.encrypt(message);
          const conversationId = message.isSent 
            ? message.recipientPubkey 
            : message.senderPubkey;

          affectedConversations.add(conversationId);

          return {
            id: message.id,
            conversationId,
            ciphertext,
            iv,
            timestamp: message.createdAt,
            cachedAt: Date.now()
          };
        } catch (error) {
          console.error(`❌ Failed to encrypt message ${message.id}:`, error);
          return null;
        }
      })
    );

    // Filter out failed encryptions
    const validMessages = encryptedMessages.filter(m => m !== null);

    if (validMessages.length === 0) {
      console.warn('⚠️ No valid messages to cache');
      return;
    }

    // Now do the transaction with already-encrypted data
    const tx = this.db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');

    // Add all messages to store synchronously (no await in loop)
    validMessages.forEach(message => {
      store.put(message);
    });

    await tx.done;

    // Update in-memory cache for affected conversations by appending new messages
    // instead of invalidating (prevents re-decryption of all messages)
    for (const conversationId of affectedConversations) {
      const existingCache = this.decryptedMessagesCache.get(conversationId);
      if (existingCache) {
        // Append new messages to existing cache
        const newMessagesForConv = messages.filter(m => {
          const msgConvId = m.isSent ? m.recipientPubkey : m.senderPubkey;
          return msgConvId === conversationId;
        });
        
        // Merge and sort by timestamp
        const updatedMessages = [...existingCache, ...newMessagesForConv]
          .sort((a, b) => a.createdAt - b.createdAt);
        
        // Deduplicate by message ID
        const uniqueMessages = Array.from(
          new Map(updatedMessages.map(m => [m.id, m])).values()
        );
        
        this.decryptedMessagesCache.set(conversationId, uniqueMessages);
        console.log(`[Cache] � Updated decrypted cache for ${conversationId.substring(0, 8)}... (${newMessagesForConv.length} new, ${uniqueMessages.length} total)`);
      }
      // If no existing cache, it will be populated on next getMessages call
    }

    console.log(`✅ Cached ${validMessages.length} messages`);
  }

  /**
   * Retrieve messages for a specific conversation
   * Uses in-memory cache to avoid re-decrypting on every access
   * 
   * PERFORMANCE OPTIMIZATION: Two-tier caching
   * 1. In-memory cache (instant, no decryption)
   * 2. IndexedDB cache (encrypted, requires decryption)
   */
  async getMessages(conversationPubkey: string): Promise<Message[]> {
    const startTime = performance.now();
    
    // Check in-memory cache first (FASTEST)
    const cached = this.decryptedMessagesCache.get(conversationPubkey);
    if (cached) {
      const elapsed = performance.now() - startTime;
      console.log(`[Cache] ⚡ Decrypted messages cache HIT for ${conversationPubkey.substring(0, 8)}... (${cached.length} messages, ${elapsed.toFixed(2)}ms)`);
      return cached;
    }

    if (!this.db) {
      const elapsed = performance.now() - startTime;
      console.log(`[Cache] ❌ Database not initialized (${elapsed.toFixed(2)}ms)`);
      return [];
    }

    try {
      const tx = this.db.transaction('messages', 'readonly');
      const index = tx.objectStore('messages').index('by-conversation');
      
      const queryStart = performance.now();
      // Get all encrypted messages for this conversation
      const encryptedMessages = await index.getAll(conversationPubkey);
      const queryElapsed = performance.now() - queryStart;

      console.log(`[Cache] 🔓 Decrypting ${encryptedMessages.length} messages for ${conversationPubkey.substring(0, 8)}... (query: ${queryElapsed.toFixed(2)}ms)`);

      // Decrypt all messages
      const decryptStart = performance.now();
      const messages: Message[] = [];
      let decryptErrors = 0;
      
      for (const encrypted of encryptedMessages) {
        try {
          const message = await this.encryption.decrypt<Message>(
            encrypted.ciphertext,
            encrypted.iv
          );
          messages.push(message);
        } catch (error) {
          decryptErrors++;
          console.error(`❌ Failed to decrypt message ${encrypted.id}:`, error);
        }
      }
      
      const decryptElapsed = performance.now() - decryptStart;
      const avgDecryptTime = encryptedMessages.length > 0 
        ? (decryptElapsed / encryptedMessages.length).toFixed(2) 
        : 'N/A';

      // Sort by timestamp
      messages.sort((a, b) => a.createdAt - b.createdAt);

      // Cache decrypted messages in memory
      this.decryptedMessagesCache.set(conversationPubkey, messages);
      
      const totalElapsed = performance.now() - startTime;
      console.log(`[Cache] 💾 Cached ${messages.length} decrypted messages for ${conversationPubkey.substring(0, 8)}... (total: ${totalElapsed.toFixed(2)}ms, decrypt: ${decryptElapsed.toFixed(2)}ms, avg: ${avgDecryptTime}ms, errors: ${decryptErrors})`);

      return messages;
    } catch (error) {
      const elapsed = performance.now() - startTime;
      console.error(`❌ Failed to get cached messages (${elapsed.toFixed(2)}ms):`, error);
      return [];
    }
  }

  /**
   * Cache conversations
   * Invalidates in-memory cache since we're updating stored data
   */
  async cacheConversations(conversations: Conversation[]): Promise<void> {
    console.log(`[Cache] 💾 cacheConversations called with ${conversations.length} conversations`, {
      dbInitialized: this.db !== null,
      encryptionReady: this.encryption.isInitialized()
    });

    if (!this.db) {
      console.warn('[Cache] ⚠️ Cache not initialized, skipping cacheConversations');
      return;
    }

    // Encrypt all conversations first, before opening transaction
    const encryptedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        try {
          const { ciphertext, iv } = await this.encryption.encrypt(conversation);
          return {
            pubkey: conversation.pubkey,
            ciphertext,
            iv,
            lastMessageTime: conversation.lastMessageAt,
            unreadCount: conversation.unreadCount || 0,
            cachedAt: Date.now()
          };
        } catch (error) {
          console.error(`❌ Failed to encrypt conversation ${conversation.pubkey}:`, error);
          return null;
        }
      })
    );

    // Filter out failed encryptions
    const validConversations = encryptedConversations.filter(c => c !== null);
    
    if (validConversations.length === 0) {
      console.warn('[Cache] ⚠️ No valid conversations to cache');
      return;
    }

    // Now do the transaction with already-encrypted data
    const tx = this.db.transaction('conversations', 'readwrite');
    const store = tx.objectStore('conversations');

    // Add all conversations to store synchronously (no await in loop)
    validConversations.forEach(conversation => {
      store.put(conversation);
    });

    await tx.done;

    // Invalidate entire conversations cache since we're bulk updating
    this.decryptedConversationsCache.clear();
    console.log(`[Cache] 🗑️ Cleared decrypted conversations cache (bulk update)`);
    
    console.log(`[Cache] ✅ Cache save transaction completed: ${validConversations.length} saved, ${conversations.length - validConversations.length} failed`);
  }

  /**
   * Update a single conversation in cache
   * Optimized method for updating one conversation (e.g., when new message arrives)
   * Invalidates in-memory cache for that conversation
   * 
   * @param conversation - Conversation to update
   */
  async updateConversation(conversation: Conversation): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      // Encrypt conversation first, before opening transaction
      const { ciphertext, iv } = await this.encryption.encrypt(conversation);

      // Now do the transaction with already-encrypted data
      const tx = this.db.transaction('conversations', 'readwrite');
      const store = tx.objectStore('conversations');

      // Store/update encrypted conversation (synchronous call)
      store.put({
        pubkey: conversation.pubkey,
        ciphertext,
        iv,
        lastMessageTime: conversation.lastMessageAt,
        unreadCount: conversation.unreadCount || 0,
        cachedAt: Date.now()
      });

      await tx.done;

      // Update in-memory cache with latest data (don't delete - would make cache incomplete!)
      this.decryptedConversationsCache.set(conversation.pubkey, conversation);
      console.log(`[Cache] ✅ Updated decrypted conversation cache for ${conversation.pubkey.substring(0, 8)}...`);
    } catch (error) {
      console.error(`❌ Failed to update conversation ${conversation.pubkey}:`, error);
    }
  }

  /**
   * Get all cached conversations
   * Uses in-memory cache to avoid re-decrypting on every access
   * 
   * PERFORMANCE OPTIMIZATION: Two-tier caching
   * 1. In-memory cache (instant, no decryption)
   * 2. IndexedDB cache (encrypted, requires decryption)
   */
  async getConversations(): Promise<Conversation[]> {
    const startTime = performance.now();
    
    console.log('[Cache] 🔍 getConversations called', {
      dbInitialized: this.db !== null,
      encryptionReady: this.encryption.isInitialized(),
      cachedCount: this.decryptedConversationsCache.size
    });

    // Check if we have all conversations cached in memory (FASTEST)
    if (this.decryptedConversationsCache.size > 0) {
      const cached = Array.from(this.decryptedConversationsCache.values());
      const elapsed = performance.now() - startTime;
      console.log(`[Cache] ⚡ Decrypted conversations cache HIT (${cached.length} conversations, ${elapsed.toFixed(2)}ms)`);
      // Sort by last message time (newest first)
      cached.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      return cached;
    }

    if (!this.db) {
      const elapsed = performance.now() - startTime;
      console.warn(`[Cache] ⚠️ Database not initialized in getConversations (${elapsed.toFixed(2)}ms)`);
      return [];
    }

    try {
      const tx = this.db.transaction('conversations', 'readonly');
      const store = tx.objectStore('conversations');
      
      const queryStart = performance.now();
      // Get all encrypted conversations
      const encryptedConvos = await store.getAll();
      const queryElapsed = performance.now() - queryStart;
      
      console.log(`[Cache] 📦 Retrieved ${encryptedConvos.length} encrypted conversations from IndexedDB (${queryElapsed.toFixed(2)}ms)`);
      console.log(`[Cache] 🔓 Decrypting ${encryptedConvos.length} conversations...`);

      // Decrypt all conversations
      const decryptStart = performance.now();
      const conversations: Conversation[] = [];
      let decryptErrors = 0;
      
      for (const encrypted of encryptedConvos) {
        try {
          const conversation = await this.encryption.decrypt<Conversation>(
            encrypted.ciphertext,
            encrypted.iv
          );
          conversations.push(conversation);
          // Cache in memory
          this.decryptedConversationsCache.set(conversation.pubkey, conversation);
        } catch (error) {
          decryptErrors++;
          console.error(`❌ Failed to decrypt conversation ${encrypted.pubkey}:`, error);
        }
      }

      const decryptElapsed = performance.now() - decryptStart;
      const avgDecryptTime = encryptedConvos.length > 0 
        ? (decryptElapsed / encryptedConvos.length).toFixed(2) 
        : 'N/A';

      console.log(`[Cache] ✅ Successfully decrypted ${conversations.length} conversations (${decryptElapsed.toFixed(2)}ms, avg: ${avgDecryptTime}ms, errors: ${decryptErrors})`);
      console.log(`[Cache] 💾 Cached ${conversations.length} decrypted conversations in memory`);

      // Sort by last message time (newest first)
      conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);

      const totalElapsed = performance.now() - startTime;
      console.log(`[Cache] 📊 Total getConversations time: ${totalElapsed.toFixed(2)}ms (query: ${queryElapsed.toFixed(2)}ms, decrypt: ${decryptElapsed.toFixed(2)}ms)`);

      return conversations;
    } catch (error) {
      const elapsed = performance.now() - startTime;
      console.error(`❌ Failed to get cached conversations (${elapsed.toFixed(2)}ms):`, error);
      return [];
    }
  }

  /**
   * Get last sync timestamp (for "since" filtering)
   */
  async getLastSyncTime(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    try {
      const metadata = await this.db.get('metadata', 'lastSyncTime');
      return (typeof metadata?.value === 'number' ? metadata.value : 0);
    } catch (error) {
      console.error('❌ Failed to get last sync time:', error);
      return 0;
    }
  }

  /**
   * Update last sync timestamp
   */
  async setLastSyncTime(timestamp: number): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.put('metadata', {
        key: 'lastSyncTime',
        value: timestamp
      });
    } catch (error) {
      console.error('❌ Failed to set last sync time:', error);
    }
  }

  /**
   * Clear all cached data (on logout)
   */
  async clearCache(): Promise<void> {
    // Clear in-memory caches first
    this.decryptedMessagesCache.clear();
    this.decryptedConversationsCache.clear();
    console.log('[Cache] 🗑️ Cleared in-memory decryption caches');

    const userDbName = this.currentUserPubkey ? `nostr-messages-${this.currentUserPubkey.substring(0, 16)}` : null;

    if (this.db) {
      try {
        const tx = this.db.transaction(['messages', 'conversations', 'metadata'], 'readwrite');
        await tx.objectStore('messages').clear();
        await tx.objectStore('conversations').clear();
        await tx.objectStore('metadata').clear();
        await tx.done;

        // Close database
        this.db.close();
        this.db = null;

        console.log('🗑️ Cleared database for user', {
          user: this.currentUserPubkey?.substring(0, 8) + '...',
          dbName: userDbName,
        });
      } catch (error) {
        console.error('❌ Failed to clear cache:', error);
      }
    }

    // Clear user tracking
    this.currentUserPubkey = null;

    // Clear encryption key
    this.encryption.clearKey();

    console.log('🔒 Cache cleared completely');
  }

  /**
   * Run data migrations
   * Called once during cache initialization
   * 
   * @param currentUserPubkey - Current user's public key
   */
  private async runMigrations(currentUserPubkey: string): Promise<void> {
    if (!this.db) {
      return;
    }

    console.log('[Cache] 🔄 Running cache migrations...');

    try {
      // MIGRATION 1: Remove self-conversations
      // Issue: Conversations where pubkey === currentUserPubkey should not exist
      // These were created before the self-message filter was implemented
      const tx = this.db.transaction('conversations', 'readwrite');
      const store = tx.objectStore('conversations');
      
      // Check if self-conversation exists
      const selfConversation = await store.get(currentUserPubkey);
      
      if (selfConversation) {
        console.log(`[Cache] 🗑️ Removing self-conversation: ${currentUserPubkey.substring(0, 8)}...`);
        await store.delete(currentUserPubkey);
        
        // Also remove associated messages
        const messageTx = this.db.transaction('messages', 'readwrite');
        const messageStore = messageTx.objectStore('messages');
        const messageIndex = messageStore.index('by-conversation');
        
        let cursor = await messageIndex.openCursor(currentUserPubkey);
        let deletedMessages = 0;
        
        while (cursor) {
          await cursor.delete();
          deletedMessages++;
          cursor = await cursor.continue();
        }
        
        console.log(`[Cache] 🧹 Removed ${deletedMessages} self-messages`);
        
        // Invalidate in-memory cache
        this.decryptedConversationsCache.delete(currentUserPubkey);
        this.decryptedMessagesCache.delete(currentUserPubkey);
      } else {
        console.log('[Cache] ✅ No self-conversation found (already clean)');
      }

      await tx.done;
      console.log('[Cache] ✅ Migrations completed');
    } catch (error) {
      console.error('[Cache] ❌ Migration failed:', error);
      // Don't throw - continue even if migration fails
    }
  }

  /**
   * Delete cached data older than TTL
   */
  private async cleanupOldCache(): Promise<void> {
    if (!this.db) {
      return;
    }

    const cutoffTime = Date.now() - (CACHE_TTL_DAYS * 24 * 60 * 60 * 1000);

    try {
      // Cleanup old messages
      const msgTx = this.db.transaction('messages', 'readwrite');
      const msgIndex = msgTx.objectStore('messages').index('by-cached-at');
      let msgCursor = await msgIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
      let deletedMessages = 0;

      while (msgCursor) {
        await msgCursor.delete();
        deletedMessages++;
        msgCursor = await msgCursor.continue();
      }

      // Cleanup old conversations
      const convoTx = this.db.transaction('conversations', 'readwrite');
      const convoIndex = convoTx.objectStore('conversations').index('by-cached-at');
      let convoCursor = await convoIndex.openCursor(IDBKeyRange.upperBound(cutoffTime));
      let deletedConvos = 0;

      while (convoCursor) {
        await convoCursor.delete();
        deletedConvos++;
        convoCursor = await convoCursor.continue();
      }

      if (deletedMessages > 0 || deletedConvos > 0) {
        console.log(`🧹 Cleaned up ${deletedMessages} old messages, ${deletedConvos} old conversations`);
      }
    } catch (error) {
      console.error('❌ Failed to cleanup old cache:', error);
    }
  }

  /**
   * Get cache statistics (for debugging)
   */
  async getCacheStats(): Promise<{
    messageCount: number;
    conversationCount: number;
    lastSyncTime: number;
  }> {
    if (!this.db) {
      return { messageCount: 0, conversationCount: 0, lastSyncTime: 0 };
    }

    try {
      const [messageCount, conversationCount, lastSyncTime] = await Promise.all([
        this.db.count('messages'),
        this.db.count('conversations'),
        this.getLastSyncTime()
      ]);

      return { messageCount, conversationCount, lastSyncTime };
    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return { messageCount: 0, conversationCount: 0, lastSyncTime: 0 };
    }
  }
}
