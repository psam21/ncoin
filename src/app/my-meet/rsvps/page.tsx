'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useMyRSVPs } from '@/hooks/useMyRSVPs';
import { MeetupCard } from '@/components/generic/MeetupCard';
import { Users, Search, Calendar } from 'lucide-react';
import { MEETUP_CONFIG } from '@/config/meetup';

export default function MyRSVPsPage() {
  const { user } = useAuthStore();
  const isHydrated = useAuthHydration();
  
  // Fetch user's RSVPs (enriched with meetup details)
  const { rsvps, isLoading, error } = useMyRSVPs();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'accepted' | 'tentative' | 'declined'>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // Filter RSVPs
  const filteredRSVPs = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    
    return rsvps.filter(({ rsvp, meetup }) => {
      if (!meetup) return false; // Skip RSVPs without meetup details

      // Status filter
      if (statusFilter !== 'all' && rsvp.status !== statusFilter) {
        return false;
      }

      // Search filter
      const matchesSearch = searchQuery === '' || 
        meetup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type filter
      const matchesType = typeFilter === 'all' || meetup.meetupType === typeFilter;

      // Time filter
      let matchesTime = true;
      if (timeFilter === 'upcoming') {
        matchesTime = meetup.startTime > now;
      } else if (timeFilter === 'past') {
        matchesTime = meetup.startTime <= now;
      }

      return matchesSearch && matchesType && matchesTime;
    });
  }, [rsvps, searchQuery, statusFilter, typeFilter, timeFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    
    const byStatus = {
      accepted: rsvps.filter(({ rsvp }) => rsvp.status === 'accepted').length,
      tentative: rsvps.filter(({ rsvp }) => rsvp.status === 'tentative').length,
      declined: rsvps.filter(({ rsvp }) => rsvp.status === 'declined').length,
    };

    const meetupsWithDetails = rsvps.filter(({ meetup }) => meetup !== null);
    const upcoming = meetupsWithDetails.filter(({ meetup }) => meetup!.startTime > now).length;
    const past = meetupsWithDetails.filter(({ meetup }) => meetup!.startTime <= now).length;

    return {
      total: rsvps.length,
      byStatus,
      upcoming,
      past,
    };
  }, [rsvps]);

  // Handler
  const handleRSVP = (meetupId: string, status: 'accepted' | 'declined' | 'tentative') => {
    console.log('RSVP updated:', meetupId, status);
    // The useMyRSVPs hook should handle re-fetching
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setTimeFilter('all');
  };

  // Wait for hydration before checking auth
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-16">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to view your RSVPs.
            </p>
            <Link href="/signin" className="btn-primary-sm">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Hero Section */}
      <section className="pt-16 lg:pt-20 pb-16 md:pb-20 bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center mb-6 gap-3">
              <Users className="w-12 h-12" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold">
                My RSVPs
              </h1>
            </div>
            <p className="text-lg text-purple-50 max-w-2xl mx-auto mb-8">
              View and manage your meetup RSVPs. Track events you&apos;re attending.
            </p>
            <Link
              href="/meet"
              className="inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
            >
              <Calendar className="w-5 h-5" />
              Browse Meetups
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-width py-8">
        {/* Statistics Dashboard */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total RSVPs */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total RSVPs</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{statistics.total}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            {/* Going */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Going</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{statistics.byStatus.accepted}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Maybe */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Maybe</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-1">{statistics.byStatus.tentative}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{statistics.upcoming}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Filter Your RSVPs
              </h2>
              <button
                onClick={handleClearFilters}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, location, or tags..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* RSVP Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  RSVP Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'accepted' | 'tentative' | 'declined')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="accepted">Going</option>
                  <option value="tentative">Maybe</option>
                  <option value="declined">Not Going</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                  Meetup Type
                </label>
                <select
                  id="type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  {MEETUP_CONFIG.meetupTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Time Filter */}
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  id="time"
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as 'all' | 'upcoming' | 'past')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Events</option>
                  <option value="upcoming">Upcoming Only</option>
                  <option value="past">Past Events</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredRSVPs.length}</span> of <span className="font-semibold text-gray-900">{rsvps.length}</span> RSVPs
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your RSVPs...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading RSVPs</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Meetups Grid */}
        {!isLoading && !error && filteredRSVPs.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredRSVPs.map(({ rsvp, meetup }) => {
              if (!meetup) return null;
              
              return (
                <div key={meetup.id} className="relative">
                  {/* RSVP Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    {rsvp.status === 'accepted' && (
                      <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        Going
                      </span>
                    )}
                    {rsvp.status === 'tentative' && (
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        Maybe
                      </span>
                    )}
                    {rsvp.status === 'declined' && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                        Not Going
                      </span>
                    )}
                  </div>
                  <MeetupCard 
                    meetup={meetup}
                    variant="grid"
                    showRSVPButton={false}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* No Results State (when filters applied but no matches) */}
        {!isLoading && !error && rsvps.length > 0 && filteredRSVPs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-primary-300 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Try adjusting your filters or search query
            </p>
            <button
              onClick={handleClearFilters}
              className="btn-primary-sm"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Empty State (no RSVPs at all) */}
        {!isLoading && !error && rsvps.length === 0 && (
          <div className="text-center py-16">
            <div className="text-primary-300 mb-4">
              <Users className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No RSVPs yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Start RSVPing to meetups to see them here
            </p>
            <Link
              href="/meet"
              className="btn-primary-sm flex items-center gap-2 mx-auto"
            >
              <Calendar className="w-4 h-4" />
              Browse Meetups
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
