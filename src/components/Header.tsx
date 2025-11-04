'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X, MessageCircle } from 'lucide-react';
import AuthButton from './auth/AuthButton';
import { useAuthStore } from '@/stores/useAuthStore';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        toggleBtnRef.current?.focus();
      }
      if (e.key === 'Tab' && menuRef.current) {
        const focusables = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-gradient-to-r from-purple-600 to-purple-700 shadow-lg`}
      >
      <nav className="container-width px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          <Link href="/" className="flex items-center group shrink-0" aria-label="Messages">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-all">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </Link>

          <div className="hidden lg:flex items-center justify-between flex-1">
            {isAuthenticated && user && (
              <div className="flex items-center gap-6 ml-8">
                <Link
                  href="/profile"
                  className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </Link>
                <Link
                  href="/burner-chat"
                  className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                  Burner Chat
                </Link>
                <Link
                  href="/messages"
                  className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Persistent Chats
                </Link>
                <Link
                  href="/meetings"
                  className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Meetings
                </Link>
                <Link
                  href="/payments"
                  className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Payments
                </Link>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <AuthButton />
          </div>

          <button
            ref={toggleBtnRef}
            onClick={() => setIsOpen((prev: boolean) => !prev)}
            aria-expanded={isOpen}
            aria-controls="mobile-nav"
            aria-label="Toggle navigation menu"
            className="lg:hidden ml-auto p-2 rounded-md text-white hover:text-orange-200 hover:bg-purple-700 transition-colors duration-200"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden" role="dialog" aria-modal="true">
            <div
              id="mobile-nav"
              ref={menuRef}
              className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg border border-gray-100 mt-2"
            >
              {!isAuthenticated || !user ? (
                <div className="px-3 py-2">
                  <AuthButton />
                </div>
              ) : (
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-purple-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-purple-800 truncate">
                          {user.profile.display_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-purple-500 truncate">
                          {user.npub || user.pubkey.substring(0, 16) + '...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-2 text-xs text-purple-500 font-medium">
                    Signed in via Nostr
                  </div>
                  
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </Link>
                  
                  <Link
                    href="/burner-chat"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                    </svg>
                    Burner Chat
                  </Link>
                  
                  <Link
                    href="/messages"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Persistent Chats
                  </Link>
                  
                  <Link
                    href="/meetings"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Meetings
                  </Link>
                  
                  <Link
                    href="/payments"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Payments
                  </Link>
                  
                  <div className="border-t border-purple-100 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      logout();
                      window.location.href = '/signin';
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
