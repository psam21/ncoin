'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { fetchWorkByAuthor, deleteWork, fetchWorkById } from '@/services/business/WorkService';
import { UnifiedWorkCard, UnifiedWorkData } from '@/components/generic/UnifiedWorkCard';
import { DeleteConfirmationModal } from '@/components/generic/DeleteConfirmationModal';
import { WORK_CATEGORIES, WORK_JOB_TYPES } from '@/config/work';
import { logger } from '@/services/core/LoggingService';
import { Search, Briefcase } from 'lucide-react';

// Work card data interface (similar to ContributionCardData)
interface WorkCardData {
  id: string;
  dTag: string;
  title: string;
  description: string;
  jobType: string;
  category: string;
  duration: string;
  payRate: number;
  currency: string;
  location: string;
  region: string;
  country?: string;
  imageUrl?: string;
  tags: string[];
  pubkey: string;
  createdAt: number;
}

// Adapter: Convert WorkCardData to UnifiedWorkData
function toUnifiedData(data: WorkCardData): UnifiedWorkData {
  return {
    id: data.id,
    dTag: data.dTag,
    title: data.title,
    description: data.description,
    jobType: data.jobType,
    category: data.category,
    duration: data.duration,
    payRate: data.payRate,
    currency: data.currency,
    location: data.location,
    region: data.region,
    country: data.country,
    imageUrl: data.imageUrl,
    tags: data.tags,
    pubkey: data.pubkey,
    createdAt: data.createdAt,
    // These fields are not present in WorkCardData
    mediaCount: undefined,
    relativeTime: undefined,
  };
}

export default function MyWorkPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isHydrated = useAuthHydration();
  const { getSigner } = useNostrSigner();

  // Debug logging to track auth state
  useEffect(() => {
    logger.info('MyWorkPage render state', {
      service: 'MyWorkPage',
      method: 'render',
      isHydrated,
      hasUser: !!user,
      userPubkey: user?.pubkey?.substring(0, 8) + '...' || 'none',
    });
  }, [isHydrated, user]);

  // State
  const [workItems, setWorkItems] = useState<WorkCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [workToDelete, setWorkToDelete] = useState<WorkCardData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load work items on mount
  useEffect(() => {
    const loadWorkItems = async () => {
      if (!user?.pubkey) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const events = await fetchWorkByAuthor(user.pubkey);

        // Map WorkEvent[] to WorkCardData[]
        const cardData: WorkCardData[] = events.map(event => ({
          id: event.id,
          dTag: event.dTag,
          title: event.title,
          description: event.summary,
          jobType: event.jobType,
          category: event.category,
          duration: event.duration,
          payRate: event.payRate,
          currency: event.currency,
          location: event.location,
          region: event.region,
          country: event.country,
          imageUrl: event.media.images[0]?.url, // First image URL as thumbnail
          tags: event.tags,
          pubkey: event.pubkey,
          createdAt: event.createdAt,
        }));

        setWorkItems(cardData);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load work opportunities';
        logger.error('Error loading work opportunities', err instanceof Error ? err : new Error(errorMsg), {
          service: 'MyWorkPage',
          method: 'loadWorkItems',
        });
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkItems();
  }, [user?.pubkey]);

  // Filter work items
  const filteredWorkItems = useMemo(() => {
    return workItems.filter(work => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        work.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        work.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Job type filter
      const matchesJobType = jobTypeFilter === 'all' || work.jobType === jobTypeFilter;

      // Category filter
      const matchesCategory = categoryFilter === 'all' || work.category === categoryFilter;

      return matchesSearch && matchesJobType && matchesCategory;
    });
  }, [workItems, searchQuery, jobTypeFilter, categoryFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const byJobType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    let totalPayRate = 0;

    workItems.forEach(work => {
      // Count by job type
      byJobType[work.jobType] = (byJobType[work.jobType] || 0) + 1;

      // Count by category
      byCategory[work.category] = (byCategory[work.category] || 0) + 1;

      // Sum pay rates (for average calculation)
      totalPayRate += work.payRate;
    });

    return {
      total: workItems.length,
      byJobType,
      byCategory,
      averagePayRate: workItems.length > 0 ? Math.round(totalPayRate / workItems.length) : 0,
    };
  }, [workItems]);

  // Handlers
  const handleEdit = (work: WorkCardData) => {
    router.push(`/my-work/edit/${work.dTag}`);
  };

  const handleDelete = (work: WorkCardData) => {
    setWorkToDelete(work);
    setDeleteModalOpen(true);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setJobTypeFilter('all');
    setCategoryFilter('all');
  };

  const handleDeleteConfirm = async () => {
    if (!workToDelete || !user?.pubkey) return;

    try {
      setIsDeleting(true);

      // Get signer
      const signer = await getSigner();
      if (!signer) {
        alert('Please connect a Nostr signer to delete work opportunities');
        return;
      }

      // Fetch full work event to get eventId
      const fullWork = await fetchWorkById(workToDelete.dTag);
      
      if (!fullWork) {
        throw new Error('Failed to fetch work opportunity for deletion');
      }
      
      // Delete work opportunity
      const result = await deleteWork(
        fullWork.id, // eventId
        signer,
        user.pubkey,
        fullWork.title
      );

      if (result.success) {
        // Remove from local state
        setWorkItems(prev => prev.filter(w => w.id !== workToDelete.id));
        setDeleteModalOpen(false);
        setWorkToDelete(null);
      } else {
        throw new Error(result.error || 'Failed to delete work opportunity');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete work opportunity';
      logger.error('Error deleting work opportunity', err instanceof Error ? err : new Error(errorMsg), {
        service: 'MyWorkPage',
        method: 'handleDeleteConfirm',
      });
      alert(`Error: ${errorMsg}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Wait for hydration before checking auth to prevent false negatives
  if (!isHydrated) {
    logger.info('MyWorkPage: Waiting for auth hydration', {
      service: 'MyWorkPage',
      method: 'render',
      isHydrated,
    });
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
    logger.warn('MyWorkPage: No user after hydration, showing sign-in required', {
      service: 'MyWorkPage',
      method: 'render',
      isHydrated,
      hasUser: !!user,
    });
    return (
      <div className="min-h-screen bg-primary-50">
        <div className="container-width py-16">
          <div className="text-center">
            <h2 className="text-2xl font-serif font-bold text-primary-800 mb-4">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              You need to sign in to view your work opportunities.
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
              <h1 className="text-3xl font-serif font-bold text-primary-900 mb-2">My Work Opportunities</h1>
              <p className="text-gray-600 text-lg">
                Manage and edit your posted opportunities
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <Link
                href="/my-work/create"
                className="btn-primary-sm"
              >
                Post New Opportunity
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        {/* Statistics Dashboard */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Opportunities */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Opportunities</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{statistics.total}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* By Job Type */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm font-medium text-gray-600 mb-3">By Job Type</p>
              <div className="space-y-2">
                {Object.entries(statistics.byJobType).slice(0, 3).map(([type, count]) => {
                  const jobType = WORK_JOB_TYPES.find(t => t.id === type);
                  return (
                    <div key={type} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{jobType?.name || type}</span>
                      <span className="font-semibold text-primary-900">{count}</span>
                    </div>
                  );
                })}
                {Object.keys(statistics.byJobType).length > 3 && (
                  <p className="text-xs text-gray-500 pt-1">+{Object.keys(statistics.byJobType).length - 3} more types</p>
                )}
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm font-medium text-gray-600 mb-3">By Category</p>
              <div className="space-y-2">
                {Object.entries(statistics.byCategory).slice(0, 3).map(([category, count]) => {
                  const cat = WORK_CATEGORIES.find(c => c.id === category);
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
              <h2 className="text-lg font-semibold text-gray-900">Filter Your Opportunities</h2>
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
              {/* Job Type Filter */}
              <div>
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
                  Job Type
                </label>
                <select
                  id="jobType"
                  value={jobTypeFilter}
                  onChange={(e) => setJobTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  {WORK_JOB_TYPES.map(type => (
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
                  {WORK_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredWorkItems.length}</span> of <span className="font-semibold text-gray-900">{workItems.length}</span> opportunities
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your opportunities...</p>
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
                <h3 className="text-lg font-medium text-red-800">Error Loading Opportunities</h3>
                <p className="text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Work Items Grid */}
        {!isLoading && !error && filteredWorkItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredWorkItems.map(work => (
              <UnifiedWorkCard 
                key={work.id} 
                work={toUnifiedData(work)}
                variant="my-work"
                onEdit={() => handleEdit(work)}
                onDelete={() => handleDelete(work)}
              />
            ))}
          </div>
        )}

        {/* No Results State (when filters applied but no matches) */}
        {!isLoading && !error && workItems.length > 0 && filteredWorkItems.length === 0 && (
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

        {/* Empty State (no work opportunities at all) */}
        {!isLoading && !error && workItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-primary-300 mb-4">
              <Briefcase className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No work opportunities yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Start posting opportunities to connect with talented professionals
            </p>
            <Link href="/my-work/create" className="btn-primary-sm">
              Post Your First Opportunity
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setWorkToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={workToDelete?.title || ''}
        message="This will publish a deletion event to Nostr relays. This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
}
