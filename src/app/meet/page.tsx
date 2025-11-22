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
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

import { usePublicMeetups } from '@/hooks/usePublicMeetups';
import { MEETUP_CONFIG } from '@/config/meetup';
import { MeetupCard } from '@/components/generic/MeetupCard';

export default function MeetPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  
  // Hook to fetch public meetups (no mock data)
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
              Discover Meetups
            </h1>
            <p className="text-lg md:text-xl text-purple-100 mb-8">
              Connect with nomads, attend workshops, and join conferences around
              the world
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-width py-8 md:py-12">
        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                placeholder="Search meetups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              {MEETUP_CONFIG.meetupTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
              <input
                type="text"
                placeholder="Filter by location..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="px-4 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>

          {/* Active Filters */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-purple-600">
                {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}{' '}
                active
              </span>
              <button
                onClick={clearFilters}
                className="text-sm text-purple-600 hover:text-purple-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-purple-900">
            {upcomingMeetups.length > 0 ? 'Upcoming Events' : 'All Events'}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-white text-purple-400 hover:bg-purple-50'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-white text-purple-400 hover:bg-purple-50'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && meetups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
            <p className="text-purple-600 font-medium">Loading meetups...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-900">Error Loading Meetups</h3>
            </div>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={refresh}
              className="btn-secondary text-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Meetups Grid/List */}
        {!isLoading && !error && filteredMeetups.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-purple-900 mb-2">
              No meetups found
            </h3>
            <p className="text-purple-600 mb-6">
              {activeFilterCount > 0
                ? 'Try adjusting your filters'
                : 'Be the first to create a meetup!'}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="btn-secondary"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Upcoming Events */}
        {upcomingMeetups.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-purple-900">
                Upcoming Events ({upcomingMeetups.length})
              </h3>
            </div>
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
                  variant={viewMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Past Events */}
        {pastMeetups.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Calendar className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-purple-900">
                Past Events ({pastMeetups.length})
              </h3>
            </div>
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }
            >
              {pastMeetups.map((meetup) => (
                <MeetupCard
                  key={meetup.id}
                  meetup={meetup}
                  variant={viewMode}
                />
              ))}
            </div>
          </div>
        )}

        {/* Load More */}
        {hasMore && !isLoading && (
          <div className="text-center mt-12">
            <button
              onClick={loadMore}
              className="btn-secondary"
            >
              <Users className="w-4 h-4 mr-2" />
              Load More Meetups
            </button>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Want to Organize a Meetup?
            </h2>
            <p className="text-lg mb-8 text-purple-50">
              Bring nomads together for workshops, conferences, or social gatherings. 
              Create your event and connect with the global nomad community.
            </p>
            <Link
              href="/my-meet/create"
              className="btn-primary inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50"
            >
              <Calendar className="w-5 h-5" />
              Create Your Meetup
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
