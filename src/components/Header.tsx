'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
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
          <Link href="/" className="flex items-center group shrink-0" aria-label="Nostr for Nomads">
            <span className="text-white font-bold text-lg hover:text-orange-200 transition-colors">
              Nostr for Nomads
            </span>
          </Link>

          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center gap-6">
              <Link
                href="/explore"
                className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Explore
              </Link>
              <Link
                href="/meet"
                className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Meet
              </Link>
              <Link
                href="/shop"
                className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Shop
              </Link>
              <Link
                href="/work"
                className="text-white hover:text-orange-200 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Work
              </Link>
            </div>
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
                <div className="py-1">
                  <Link
                    href="/explore"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Explore
                  </Link>
                  
                  <Link
                    href="/meet"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Meet
                  </Link>
                  
                  <Link
                    href="/shop"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Shop
                  </Link>
                  
                  <Link
                    href="/work"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Work
                  </Link>
                  
                  <div className="border-t border-purple-100 my-1"></div>
                  
                  <div className="px-3 py-2">
                    <AuthButton />
                  </div>
                </div>
              ) : (
                <div className="py-1">
                  <div className="px-4 py-3 border-b border-purple-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-purple-800 truncate">
                          {user.profile.display_name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-purple-500">
                          Signed in via Nostr
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    href="/my-contributions"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    My Contributions
                  </Link>
                  
                  <Link
                    href="/my-shop"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    My Shop Items
                  </Link>
                  
                  <Link
                    href="/my-work"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    My Work Items
                  </Link>
                  
                  <Link
                    href="/messages"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    My Messages
                  </Link>
                  
                  <Link
                    href="/payments"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    My Payments
                  </Link>
                  
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </Link>
                  
                  <div className="border-t border-purple-100 my-1"></div>
                  
                  <div className="px-4 py-2 text-xs text-purple-500 font-medium uppercase tracking-wider">
                    Create
                  </div>
                  
                  <Link
                    href="/contribute"
                    className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Contribution
                  </Link>
                  
                  <Link
                    href="/my-shop/create"
                    className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Shop Listing
                  </Link>
                  
                  <Link
                    href="/my-work/create"
                    className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Work Listing
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
