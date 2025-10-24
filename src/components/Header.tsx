'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X, MessageCircle } from 'lucide-react';
import AuthButton from './auth/AuthButton';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        toggleBtnRef.current?.focus();
      }
      // Basic focus trap: cycle Tab within menu when open
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
        {/* Main header content - Logo + Navigation + Auth/Cart */}
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center group shrink-0" aria-label="Messages">
            <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-all">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
          </Link>

          {/* Desktop Navigation - Empty now, items are in AuthButton dropdown */}
          <div className="hidden lg:flex items-center justify-between flex-1">
            {/* Navigation items removed - now in profile dropdown */}
          </div>

          {/* Auth Section - Separate area on the right */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <AuthButton />
          </div>

          {/* Mobile menu button - only visible on mobile */}
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

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="lg:hidden" role="dialog" aria-modal="true">
            <div
              id="mobile-nav"
              ref={menuRef}
              className="px-2 pt-2 pb-3 space-y-1 bg-white rounded-lg shadow-lg border border-gray-100 mt-2"
            >
              {/* Auth Button - Mobile */}
              <div className="px-3 py-2">
                <AuthButton />
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
