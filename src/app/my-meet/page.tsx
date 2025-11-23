'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useMyMeetups } from '@/hooks/useMyMeetups';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { deleteMeetup, fetchMeetupByDTag } from '@/services/business/MeetService';
import { MyMeetupCard } from '@/components/generic/MyMeetupCard';
import { DeleteConfirmationModal } from '@/components/generic/DeleteConfirmationModal';
import { Calendar, Plus, Search, Filter } from 'lucide-react';
import { logger } from '@/services/core/LoggingService';
import { MEETUP_CONFIG } from '@/config/meetup';
import type { MeetupCardData } from '@/types/meetup';

export default function MyMeetPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isHydrated = useAuthHydration();
  const { getSigner } = useNostrSigner();
  
  // Fetch user's meetups
  const { meetups, isLoading, error, loadMyMeetups } = useMyMeetups();

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [meetupToDelete, setMeetupToDelete] = useState<MeetupCardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  // Filter meetups
  const filteredMeetups = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    
    return meetups.filter(meetup => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        meetup.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meetup.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Type filter
      const matchesType = typeFilter === 'all' || meetup.meetupType === typeFilter;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'upcoming') {
        matchesStatus = meetup.startTime > now;
      } else if (statusFilter === 'past') {
        matchesStatus = meetup.startTime <= now;
      }

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [meetups, searchQuery, typeFilter, statusFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const upcoming = meetups.filter(m => m.startTime > now);
    const past = meetups.filter(m => m.startTime <= now);
    
    const byType: Record<string, number> = {};
    meetups.forEach(meetup => {
      byType[meetup.meetupType] = (byType[meetup.meetupType] || 0) + 1;
    });

    const totalRSVPs = meetups.reduce((sum, m) => {
      return sum + (m.rsvpCount?.accepted || 0);
    }, 0);

    return {
      total: meetups.length,
      upcoming: upcoming.length,
      past: past.length,
      byType,
      totalRSVPs,
    };
  }, [meetups]);

  // Handlers
  const handleEdit = (meetupId: string) => {
    const meetup = meetups.find(m => m.id === meetupId);
    if (meetup) {
      router.push(`/my-meet/edit/${meetup.dTag}`);
    }
  };

  const handleDelete = async (meetupId: string) => {
    const meetup = meetups.find(m => m.id === meetupId);
    if (meetup) {
      setMeetupToDelete(meetup);
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!meetupToDelete || !user) return;

    try {
      setIsDeleting(true);
      logger.info('Deleting meetup', {
        service: 'MyMeetPage',
        method: 'handleDeleteConfirm',
        meetupId: meetupToDelete.id,
      });

      const signer = await getSigner();
      if (!signer) {
        throw new Error('No signer available');
      }

      // Delete using MeetService
      const result = await deleteMeetup(
        meetupToDelete.id,
        signer,
        user.pubkey,
        meetupToDelete.name
      );

      if (result.success) {
        // Refetch meetups to update list
        await loadMyMeetups();
        setDeleteModalOpen(false);
        setMeetupToDelete(null);
      } else {
        throw new Error(result.error || 'Failed to delete meetup');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete meetup';
      logger.error('Error deleting meetup', err instanceof Error ? err : new Error(errorMsg), {
        service: 'MyMeetPage',
        method: 'handleDeleteConfirm',
      });
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setStatusFilter('all');
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
              You need to sign in to manage your meetups.
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
            <div className="flex items-center justify-center mb-6">
              <Calendar className="w-12 h-12 mr-4" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold">
                My Meetups
              </h1>
            </div>
            <p className="text-lg text-purple-50 max-w-2xl mx-auto mb-8">
              Manage your hosted meetups. Organize events and connect with the community.
            </p>
            <Link
              href="/my-meet/create"
              className="inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50 px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create New Meetup
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container-width py-8">
        {/* Statistics Dashboard */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Meetups */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Meetups</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{statistics.total}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <Calendar className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            {/* Upcoming */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming</p>
                  <p className="text-3xl font-bold text-green-900 mt-1">{statistics.upcoming}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Past */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Past Events</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{statistics.past}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Total RSVPs */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total RSVPs</p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">{statistics.totalRSVPs}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
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
                <Filter className="w-5 h-5" />
                Filter Your Meetups
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
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, location, or tags..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* Status Filter */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'upcoming' | 'past')}
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
                Showing <span className="font-semibold text-gray-900">{filteredMeetups.length}</span> of <span className="font-semibold text-gray-900">{meetups.length}</span> meetups
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your meetups...</p>
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
                <h3 className="text-lg font-medium text-red-800">Error Loading Meetups</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Meetups Grid */}
        {!isLoading && !error && filteredMeetups.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredMeetups.map(meetup => (
              <MyMeetupCard 
                key={meetup.id} 
                meetup={meetup}
                onEdit={() => handleEdit(meetup.id)}
                onDelete={() => handleDelete(meetup.id)}
              />
            ))}
          </div>
        )}

        {/* No Results State (when filters applied but no matches) */}
        {!isLoading && !error && meetups.length > 0 && filteredMeetups.length === 0 && (
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

        {/* Empty State (no meetups at all) */}
        {!isLoading && !error && meetups.length === 0 && (
          <div className="text-center py-16">
            <div className="text-primary-300 mb-4">
              <Calendar className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No meetups yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Start organizing meetups and connecting with the community
            </p>
            <Link
              href="/my-meet/create"
              className="btn-primary-sm flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Your First Meetup
            </Link>
          </div>
        )}
      </div>

      {/* CTA Section - Always visible */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-orange-600 text-white">
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setMeetupToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={meetupToDelete?.name || ''}
        message="This will publish a deletion event to Nostr relays. This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
}
