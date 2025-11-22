'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
  AlertCircle,
  Calendar,
  Grid3x3,
  List,
  MapPin,
  Users,
} from 'lucide-react';

import { usePublicMeetups } from '@/hooks/usePublicMeetups';
import { MEETUP_CONFIG } from '@/config/meetup';
import { MeetupCard } from '@/components/generic/MeetupCard';

export default function MeetBrowseContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  
  // Hook to fetch public meetups
  const {
    meetups,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh,
  } = usePublicMeetups(20, false); // upcomingOnly = false to show all

  // Client-side filtering and sorting
  const filteredMeetups = useMemo(() => {
    let filtered = [...meetups];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.location.toLowerCase().includes(query) ||
          m.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Type filter
    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter((m) => m.meetupType === selectedType);
    }

    // Location filter
    if (locationFilter) {
      const locQuery = locationFilter.toLowerCase();
      filtered = filtered.filter((m) =>
        m.location.toLowerCase().includes(locQuery)
      );
    }

    // Sort
    if (sortBy === 'date') {
      filtered.sort((a, b) => a.startTime - b.startTime);
    } else {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [meetups, searchQuery, selectedType, locationFilter, sortBy]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedType && selectedType !== 'all') count++;
    if (locationFilter) count++;
    return count;
  }, [searchQuery, selectedType, locationFilter]);

  // Separate upcoming and past events
  const now = Math.floor(Date.now() / 1000);
  const upcomingMeetups = filteredMeetups.filter((m) => m.startTime > now);
  const pastMeetups = filteredMeetups.filter((m) => m.startTime <= now);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setLocationFilter('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      {/* Hero Section */}
      <section className="pt-16 lg:pt-20 pb-16 md:pb-20 bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Nomad Meetups
            </h1>
            <p className="text-lg text-purple-50 max-w-2xl mx-auto mb-8">
              Connect with fellow digital nomads at local meetups, events, and gatherings. 
              Join virtual or in-person events happening around the world.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="Real events from real nomads"
              >
                <Calendar className="w-4 h-4 mr-2 text-white" />
                <span>Real Events</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="Virtual and in-person meetups"
              >
                <MapPin className="w-4 h-4 mr-2 text-white" />
                <span>Global Locations</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="RSVP and track attendance"
              >
                <Users className="w-4 h-4 mr-2 text-white" />
                <span>RSVP & Connect</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-white">
        <div className="container-width">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search meetups by name, location, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-4 py-3 text-base rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="section-padding">
        <div className="container-width">
          {/* Filter UI */}
          {isLoading && meetups.length === 0 ? (
            // Loading skeleton for filters
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8 animate-pulse">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded ml-4"></div>
                <div className="h-10 w-40 bg-gray-200 rounded"></div>
              </div>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="h-10 w-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
              {/* Left side: Type, Location, Sort filters */}
              <div className="flex gap-4 items-center flex-wrap">
                <label className="text-sm font-medium text-gray-700">Type:</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="all">All Types</option>
                  {MEETUP_CONFIG.meetupTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <label className="text-sm font-medium text-gray-700 ml-4">Location:</label>
                <input
                  type="text"
                  placeholder="Filter by location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm w-48"
                />

                <label className="text-sm font-medium text-gray-700 ml-4">Sort:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="date">By Date</option>
                  <option value="name">By Name</option>
                </select>

                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium ml-2"
                  >
                    Clear filters ({activeFilterCount})
                  </button>
                )}
              </div>

              {/* Right side: View mode toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Results count */}
          {!isLoading && filteredMeetups.length > 0 && (
            <div className="mb-6 text-sm text-gray-600">
              <span className="font-medium">{filteredMeetups.length}</span>{' '}
              {filteredMeetups.length === 1 ? 'meetup' : 'meetups'} found
              {activeFilterCount > 0 && ' (filtered)'}
            </div>
          )}

          {/* Loading State */}
          {isLoading && meetups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600 text-lg">Loading meetups...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-gray-900 text-lg font-semibold mb-2">Error loading meetups</p>
              <p className="text-gray-600 mb-4">{error}</p>
              <button onClick={refresh} className="btn-primary">
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredMeetups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Calendar className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-900 text-lg font-semibold mb-2">
                {activeFilterCount > 0
                  ? 'No meetups match your filters'
                  : 'No meetups found'}
              </p>
              <p className="text-gray-600 mb-4">
                {activeFilterCount > 0
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to create a meetup!'}
              </p>
              {activeFilterCount > 0 && (
                <button onClick={clearFilters} className="btn-outline">
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Upcoming Meetups */}
          {!isLoading && upcomingMeetups.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Upcoming Events ({upcomingMeetups.length})
              </h2>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {upcomingMeetups.map((meetup) => (
                  <MeetupCard
                    key={meetup.id}
                    meetup={meetup}
                    variant={viewMode === 'list' ? 'list' : 'grid'}
                    showRSVPButton={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Meetups */}
          {!isLoading && pastMeetups.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Past Events ({pastMeetups.length})
              </h2>
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75'
                    : 'space-y-4 opacity-75'
                }
              >
                {pastMeetups.map((meetup) => (
                  <MeetupCard
                    key={meetup.id}
                    meetup={meetup}
                    variant={viewMode === 'list' ? 'list' : 'grid'}
                    showRSVPButton={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Load More Button */}
          {!isLoading && !error && hasMore && filteredMeetups.length > 0 && (
            <div className="flex justify-center mt-12">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="btn-primary px-8"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Meetups'
                )}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
