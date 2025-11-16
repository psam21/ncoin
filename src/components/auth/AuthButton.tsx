'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';

export default function AuthButton() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debug logging removed for production

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
    
    // Redirect to sign-in page after logout
    // Use replace to prevent back button from bringing user back to authenticated page
    if (typeof window !== 'undefined') {
      window.location.replace('/signin');
    }
  };

  // Don't show loading state on home page - only show when explicitly detecting

  // Show sign in button if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center space-x-2">
        <Link
          href="/signin"
          className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full font-medium hover:bg-purple-200 transition-colors duration-200 whitespace-nowrap border border-purple-300"
        >
          Sign In
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors duration-200 whitespace-nowrap"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  // Show authenticated user button with dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center justify-center px-4 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors duration-200 font-medium space-x-2"
        aria-expanded={showDropdown}
        aria-haspopup="menu"
        onKeyDown={handleKeyDown}
      >
        <span>{user.profile.display_name || 'Anonymous'}</span>
        <svg
          className={`w-4 h-4 text-white transition-transform duration-200 ${
            showDropdown ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white rounded-lg shadow-lg border border-purple-200 py-2 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-purple-100">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                {user.profile.picture ? (
                  <Image
                    src={user.profile.picture}
                    alt="Profile"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
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

          {/* Menu Items */}
          <div className="py-1">
            <div className="px-4 py-2 text-xs text-purple-500 font-medium">
              Signed in via Nostr
            </div>
            
            <Link
              href="/my-contributions"
              className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
              role="menuitem"
              onClick={() => setShowDropdown(false)}
            >
              <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              My Contributions
            </Link>
            
            <Link
              href="/my-shop"
              className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
              role="menuitem"
              onClick={() => setShowDropdown(false)}
            >
              <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              My Shop
            </Link>
            
            <Link
              href="/messages"
              className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
              role="menuitem"
              onClick={() => setShowDropdown(false)}
            >
              <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              My Messages
            </Link>
            
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 transition-colors"
              role="menuitem"
              onClick={() => setShowDropdown(false)}
            >
              <svg className="w-4 h-4 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>
            
            <div className="border-t border-purple-100 my-1"></div>
            
            <Link
              href="/my-shop/create"
              className="flex items-center px-4 py-2 text-sm text-green-700 hover:bg-green-50 transition-colors font-medium"
              role="menuitem"
              onClick={() => setShowDropdown(false)}
            >
              <svg className="w-4 h-4 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              List New Product
            </Link>
            
            <div className="border-t border-purple-100 my-1"></div>
            
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              role="menuitem"
            >
              <svg className="w-4 h-4 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
