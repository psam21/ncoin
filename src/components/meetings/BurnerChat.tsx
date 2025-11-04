'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Users, Clock, Trash2, Copy, Check } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface BurnerChatProps {
  meetingId: string;
  meetingTitle: string;
  onClose: () => void;
  expiresAt?: Date;
}

export function BurnerChat({ meetingId, meetingTitle, onClose, expiresAt }: BurnerChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const meetingUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/meetings?join=${meetingId}` 
    : '';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isJoined && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isJoined]);

  const handleJoin = () => {
    if (username.trim()) {
      setIsJoined(true);
      setParticipants(prev => [...prev, username]);
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: 'System',
        message: `${username} joined the chat`,
        timestamp: new Date(),
        isOwn: false,
      };
      setMessages(prev => [...prev, systemMessage]);
    }
  };

  const handleSend = () => {
    if (inputMessage.trim() && isJoined) {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        sender: username,
        message: inputMessage.trim(),
        timestamp: new Date(),
        isOwn: true,
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isJoined) {
        handleSend();
      } else {
        handleJoin();
      }
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all messages? This cannot be undone.')) {
      setMessages([]);
    }
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
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{meetingTitle}</h2>
            <div className="flex items-center gap-4 text-sm text-orange-100 mt-1">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {participants.length} participant{participants.length !== 1 ? 's' : ''}
              </span>
              {expiresAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getTimeRemaining()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyUrl}
              className="p-2 hover:bg-orange-700 rounded-lg transition-colors"
              title="Copy invite link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="p-2 hover:bg-orange-700 rounded-lg transition-colors"
                title="Clear all messages"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-orange-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Join Screen or Chat */}
        {!isJoined ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="max-w-md w-full space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Join Burner Chat
                </h3>
                <p className="text-gray-600">
                  Enter your name to join this temporary chat room
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              <button
                onClick={handleJoin}
                disabled={!username.trim()}
                className="w-full px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Chat
              </button>

              <div className="bg-orange-50 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-medium text-orange-900 mb-2">⚠️ Burner Chat Notice</p>
                <ul className="space-y-1 text-xs">
                  <li>• Messages are not encrypted or stored</li>
                  <li>• Chat will expire when the meeting ends</li>
                  <li>• Anyone with the link can join</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] ${
                      msg.sender === 'System'
                        ? 'w-full text-center'
                        : msg.isOwn
                        ? 'bg-orange-600 text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm shadow-sm'
                    } px-4 py-2`}
                  >
                    {msg.sender === 'System' ? (
                      <p className="text-xs text-gray-500 italic">{msg.message}</p>
                    ) : (
                      <>
                        {!msg.isOwn && (
                          <p className="text-xs font-medium mb-1 opacity-75">
                            {msg.sender}
                          </p>
                        )}
                        <p className="text-sm break-words">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.isOwn ? 'text-orange-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(msg.timestamp)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputMessage.trim()}
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
