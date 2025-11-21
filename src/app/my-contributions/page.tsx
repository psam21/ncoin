'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { fetchContributionsByAuthor, deleteContribution, fetchContributionById } from '@/services/business/ContributionService';
import { UnifiedContributionCard, UnifiedContributionData } from '@/components/generic/UnifiedContributionCard';
import { DeleteConfirmationModal } from '@/components/generic/DeleteConfirmationModal';
import { ContributionCardData } from '@/types/contributions';
import { CONTRIBUTION_TYPES, getNomadCategories } from '@/config/contributions';
import { logger } from '@/services/core/LoggingService';

// Adapter: Convert ContributionCardData to UnifiedContributionData
function toUnifiedData(data: ContributionCardData): UnifiedContributionData {
  return {
    id: data.id,
    dTag: data.dTag,
    title: data.title,
    description: data.description,
    contributionType: data.contributionType,
    category: data.category,
    location: data.location,
    region: data.region,
    country: data.country,
    imageUrl: data.imageUrl,
    tags: data.tags,
    pubkey: data.pubkey,
    createdAt: data.createdAt,
    // These fields are not present in ContributionCardData
    contributors: undefined,
    mediaCount: undefined,
    relativeTime: undefined,
  };
}

export default function MyContributionsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getSigner } = useNostrSigner();

  // State
  const [contributions, setContributions] = useState<ContributionCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contributionToDelete, setContributionToDelete] = useState<ContributionCardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [contributionTypeFilter, setContributionTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load contributions on mount
  useEffect(() => {
    const loadContributions = async () => {
      if (!user?.pubkey) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const events = await fetchContributionsByAuthor(user.pubkey);

        // Map ContributionEvent[] to ContributionCardData[]
        const cardData: ContributionCardData[] = events.map(event => ({
          id: event.id,
          dTag: event.dTag,
          title: event.title,
          description: event.summary,
          contributionType: event.contributionType,
          category: event.category,
          location: event.location,
          region: event.region,
          country: event.country,
          imageUrl: event.media.images[0]?.url, // First image URL as thumbnail
          tags: event.tags,
          pubkey: event.pubkey,
          createdAt: event.createdAt,
        }));

        setContributions(cardData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load contributions';
        logger.error('Error loading contributions', err instanceof Error ? err : new Error(errorMsg), {
          service: 'MyContributionsPage',
          method: 'loadContributions',
        });
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadContributions();
  }, [user?.pubkey]);

  // Filter contributions
  const filteredContributions = useMemo(() => {
    return contributions.filter(contribution => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        contribution.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contribution.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contribution.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Contribution type filter
      const matchesType = contributionTypeFilter === 'all' || contribution.contributionType === contributionTypeFilter;

      // Category filter
      const matchesCategory = categoryFilter === 'all' || contribution.category === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [contributions, searchQuery, contributionTypeFilter, categoryFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    contributions.forEach(contribution => {
      // Count by contribution type
      byType[contribution.contributionType] = (byType[contribution.contributionType] || 0) + 1;

      // Count by category
      byCategory[contribution.category] = (byCategory[contribution.category] || 0) + 1;
    });

    return {
      total: contributions.length,
      byType,
      byCategory,
    };
  }, [contributions]);

  // Handlers
  const handleEdit = (contribution: ContributionCardData) => {
    router.push(`/my-contributions/edit/${contribution.dTag}`);
  };

  const handleDelete = (contribution: ContributionCardData) => {
    setContributionToDelete(contribution);
    setDeleteModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setContributionTypeFilter('all');
    setCategoryFilter('all');
  };

  const handleDeleteConfirm = async () => {
    if (!contributionToDelete || !user?.pubkey) return;

    try {
      setIsDeleting(true);

      // Get signer
      const signer = await getSigner();
      if (!signer) {
        alert('Please connect a Nostr signer to delete contributions');
        return;
      }

      // Fetch full contribution to get eventId
      const fullContribution = await fetchContributionById(contributionToDelete.dTag);
      
      if (!fullContribution) {
        throw new Error('Failed to fetch contribution for deletion');
      }
      
      // Delete contribution
      const result = await deleteContribution(
        fullContribution.id, // eventId
        signer,
        user.pubkey,
        fullContribution.title
      );

      if (result.success) {
        // Remove from local state
        setContributions(prev => prev.filter(c => c.id !== contributionToDelete.id));
        setDeleteModalOpen(false);
        setContributionToDelete(null);
      } else {
        throw new Error(result.error || 'Failed to delete contribution');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete contribution';
      logger.error('Error deleting contribution', err instanceof Error ? err : new Error(errorMsg), {
        service: 'MyContributionsPage',
        method: 'handleDeleteConfirm',
      });
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-16">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to view your contributions.
            </p>
            <a href="/signin" className="btn-primary-sm">
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container-width py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-900 mb-2">My Contributions</h1>
              <p className="text-gray-600 text-lg">
                Manage and edit your nomad contributions
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <a
                href="/contribute"
                className="btn-primary-sm"
              >
                Add New Contribution
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        {/* Statistics Dashboard */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Contributions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Contributions</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{statistics.total}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            {/* By Contribution Type */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm font-medium text-gray-600 mb-3">By Contribution Type</p>
              <div className="space-y-2">
                {Object.entries(statistics.byType).slice(0, 3).map(([type, count]) => {
                  const contributionType = CONTRIBUTION_TYPES.find(t => t.id === type);
                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{contributionType?.name || type}</span>
                      <span className="font-semibold text-primary-900">{count}</span>
                    </div>
                  );
                })}
                {Object.keys(statistics.byType).length > 3 && (
                  <p className="text-xs text-gray-500 pt-1">+{Object.keys(statistics.byType).length - 3} more types</p>
                )}
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm font-medium text-gray-600 mb-3">By Category</p>
              <div className="space-y-2">
                {Object.entries(statistics.byCategory).slice(0, 3).map(([category, count]) => {
                  const cat = getNomadCategories().find(c => c.id === category);
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{cat?.name || category}</span>
                      <span className="font-semibold text-primary-900">{count}</span>
                    </div>
                  );
                })}
                {Object.keys(statistics.byCategory).length > 3 && (
                  <p className="text-xs text-gray-500 pt-1">+{Object.keys(statistics.byCategory).length - 3} more categories</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!isLoading && !error && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filter Your Contributions</h2>
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
                placeholder="Search by title, description, or tags..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contribution Type Filter */}
              <div>
                <label htmlFor="contributionType" className="block text-sm font-medium text-gray-700 mb-2">
                  Contribution Type
                </label>
                <select
                  id="contributionType"
                  value={contributionTypeFilter}
                  onChange={(e) => setContributionTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  {CONTRIBUTION_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Categories</option>
                  {getNomadCategories().map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredContributions.length}</span> of <span className="font-semibold text-gray-900">{contributions.length}</span> contributions
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your contributions...</p>
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
                <h3 className="text-lg font-medium text-red-800">Error Loading Contributions</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Contributions Grid */}
        {!isLoading && !error && filteredContributions.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredContributions.map(contribution => (
              <UnifiedContributionCard 
                key={contribution.id} 
                contribution={toUnifiedData(contribution)}
                variant="my-contributions"
                onEdit={() => handleEdit(contribution)}
                onDelete={() => handleDelete(contribution)}
              />
            ))}
          </div>
        )}

        {/* No Results State (when filters applied but no matches) */}
        {!isLoading && !error && contributions.length > 0 && filteredContributions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-primary-300 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
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

        {/* Empty State (no contributions at all) */}
        {!isLoading && !error && contributions.length === 0 && (
          <div className="text-center py-16">
            <div className="text-primary-300 mb-4">
              <svg
                className="w-20 h-20 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No contributions yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Start sharing your nomad experiences with the community
            </p>
            <a href="/contribute" className="btn-primary-sm">
              Create Your First Contribution
            </a>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setContributionToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={contributionToDelete?.title || ''}
        message="This will publish a deletion event to Nostr relays. This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
}
