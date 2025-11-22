import React, { useState, useRef, useEffect } from 'react';
import { Users, Check, X, HelpCircle, ChevronDown, Loader2 } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';

export type RSVPStatus = 'accepted' | 'declined' | 'tentative' | null;

interface RSVPButtonProps {
  currentStatus: RSVPStatus;
  onStatusChange: (status: 'accepted' | 'declined' | 'tentative') => void;
  isLoading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * RSVP Button Component
 * Interactive button for managing RSVP status to meetups
 * 
 * SOA Layer: Presentation (UI only, state passed from parent)
 * 
 * Features:
 * - Dropdown menu for status selection
 * - Visual indicators for current status
 * - Loading states
 * - Responsive sizing
 * - Keyboard navigation
 */
export const RSVPButton: React.FC<RSVPButtonProps> = ({
  currentStatus,
  onStatusChange,
  isLoading = false,
  disabled = false,
  size = 'md',
  showLabel = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleStatusSelect = (status: 'accepted' | 'declined' | 'tentative') => {
    logger.info('RSVP status selected', {
      component: 'RSVPButton',
      method: 'handleStatusSelect',
      status,
      previousStatus: currentStatus,
    });

    setIsOpen(false);
    onStatusChange(status);
  };

  const toggleDropdown = () => {
    if (!disabled && !isLoading) {
      setIsOpen(!isOpen);
    }
  };

  // Get button styling based on current status
  const getButtonStyle = () => {
    const baseClasses = 'relative flex items-center gap-2 font-medium transition-all duration-200 rounded-lg';
    
    let sizeClasses = '';
    switch (size) {
      case 'sm':
        sizeClasses = 'px-3 py-1.5 text-sm';
        break;
      case 'lg':
        sizeClasses = 'px-5 py-2.5 text-base';
        break;
      default:
        sizeClasses = 'px-4 py-2 text-sm';
    }

    let statusClasses = '';
    if (disabled) {
      statusClasses = 'bg-gray-100 text-gray-400 cursor-not-allowed';
    } else if (isLoading) {
      statusClasses = 'bg-gray-100 text-gray-500 cursor-wait';
    } else {
      switch (currentStatus) {
        case 'accepted':
          statusClasses = 'bg-green-500 text-white hover:bg-green-600 shadow-sm';
          break;
        case 'declined':
          statusClasses = 'bg-red-500 text-white hover:bg-red-600 shadow-sm';
          break;
        case 'tentative':
          statusClasses = 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm';
          break;
        default:
          statusClasses = 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-purple-400';
      }
    }

    return `${baseClasses} ${sizeClasses} ${statusClasses}`;
  };

  // Get icon based on current status
  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

    if (isLoading) {
      return <Loader2 className={`${iconSize} animate-spin`} />;
    }

    switch (currentStatus) {
      case 'accepted':
        return <Check className={iconSize} />;
      case 'declined':
        return <X className={iconSize} />;
      case 'tentative':
        return <HelpCircle className={iconSize} />;
      default:
        return <Users className={iconSize} />;
    }
  };

  // Get button label based on current status
  const getButtonLabel = () => {
    if (!showLabel) return null;

    switch (currentStatus) {
      case 'accepted':
        return 'Going';
      case 'declined':
        return 'Not Going';
      case 'tentative':
        return 'Maybe';
      default:
        return 'RSVP';
    }
  };

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        onClick={toggleDropdown}
        disabled={disabled || isLoading}
        className={getButtonStyle()}
        aria-label="RSVP to event"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {getStatusIcon()}
        {showLabel && <span>{getButtonLabel()}</span>}
        {!disabled && !isLoading && (
          <ChevronDown 
            className={`${iconSize} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </button>

      {isOpen && !disabled && !isLoading && (
        <div 
          className="absolute z-50 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-in fade-in slide-in-from-top-2 duration-200"
          role="menu"
          aria-orientation="vertical"
        >
          <button
            onClick={() => handleStatusSelect('accepted')}
            className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              currentStatus === 'accepted' ? 'bg-green-50 text-green-700' : 'text-gray-700'
            }`}
            role="menuitem"
          >
            <Check className="w-4 h-4 text-green-600" />
            <div className="text-left">
              <div className="font-medium">Going</div>
              <div className="text-xs text-gray-500">I&apos;ll be there</div>
            </div>
            {currentStatus === 'accepted' && (
              <div className="ml-auto w-2 h-2 rounded-full bg-green-600" />
            )}
          </button>

          <button
            onClick={() => handleStatusSelect('tentative')}
            className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              currentStatus === 'tentative' ? 'bg-yellow-50 text-yellow-700' : 'text-gray-700'
            }`}
            role="menuitem"
          >
            <HelpCircle className="w-4 h-4 text-yellow-600" />
            <div className="text-left">
              <div className="font-medium">Maybe</div>
              <div className="text-xs text-gray-500">Not sure yet</div>
            </div>
            {currentStatus === 'tentative' && (
              <div className="ml-auto w-2 h-2 rounded-full bg-yellow-600" />
            )}
          </button>

          <button
            onClick={() => handleStatusSelect('declined')}
            className={`w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              currentStatus === 'declined' ? 'bg-red-50 text-red-700' : 'text-gray-700'
            }`}
            role="menuitem"
          >
            <X className="w-4 h-4 text-red-600" />
            <div className="text-left">
              <div className="font-medium">Not Going</div>
              <div className="text-xs text-gray-500">Can&apos;t attend</div>
            </div>
            {currentStatus === 'declined' && (
              <div className="ml-auto w-2 h-2 rounded-full bg-red-600" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};
