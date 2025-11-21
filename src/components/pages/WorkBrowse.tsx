'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Briefcase,
  Globe,
  DollarSign,
  ArrowRight,
  Loader2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

import { usePublicWorkOpportunities, type WorkFilters } from '@/hooks/usePublicWorkOpportunities';
import { UnifiedWorkCard, UnifiedWorkData } from '@/components/generic/UnifiedWorkCard';
import type { WorkExploreItem } from '@/services/business/WorkService';

// Adapter: Convert WorkExploreItem to UnifiedWorkData
function toUnifiedData(item: WorkExploreItem): UnifiedWorkData {
  return {
    id: item.id,
    dTag: item.dTag,
    title: item.name, // WorkExploreItem uses 'name' instead of 'title'
    description: item.description,
    jobType: item.jobType,
    category: item.category,
    duration: item.duration,
    payRate: item.payRate,
    currency: item.currency,
    location: item.location,
    region: item.region,
    country: undefined, // Not present in WorkExploreItem
    imageUrl: item.image, // WorkExploreItem uses 'image' instead of 'imageUrl'
    tags: item.tags,
    pubkey: item.pubkey,
    createdAt: item.publishedAt, // WorkExploreItem uses 'publishedAt' instead of 'createdAt'
    mediaCount: item.mediaCount,
    relativeTime: item.relativeTime,
  };
}

export default function WorkContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'payrate-desc'>('newest');

  // Build filters object
  const filters: WorkFilters = useMemo(() => ({
    searchTerm,
    category: categoryFilter,
    jobType: jobTypeFilter,
    region: regionFilter,
    sortBy,
  }), [searchTerm, categoryFilter, jobTypeFilter, regionFilter, sortBy]);

  const {
    workItems: filteredWorkItems,
    isLoading,
    error,
    refetch,
    loadMore,
    isLoadingMore,
    hasMore,
    availableCategories,
    availableJobTypes,
    availableRegions,
    activeFilterCount,
  } = usePublicWorkOpportunities(filters);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setJobTypeFilter('all');
    setRegionFilter('all');
    setSortBy('newest');
  };

  const featured = filteredWorkItems.slice(0, 2);
  const grid = filteredWorkItems.slice(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <section className="section-padding bg-white border-b border-gray-200">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-purple-800 mb-6">
              Work Opportunities
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Discover remote work, freelance gigs, and project-based opportunities from the digital nomad community. 
              Connect with projects that match your skills and lifestyle.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 text-purple-700">
              <div
                className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                title="Verified job opportunities"
              >
                <Briefcase className="w-4 h-4 mr-2 text-orange-500" />
                <span>Real Opportunities</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                title="Remote, on-site, and hybrid positions"
              >
                <Globe className="w-4 h-4 mr-2 text-orange-500" />
                <span>Flexible Locations</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                title="Competitive pay in BTC, sats, or USD"
              >
                <DollarSign className="w-4 h-4 mr-2 text-orange-500" />
                <span>Fair Pay</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-8 bg-white">
        <div className="container-width">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, skills, or technologies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-4 py-3 text-base rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-width">
          {/* Filter UI */}
          {isLoading ? (
            // Loading skeleton for filters
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8 animate-pulse">
              <div className="flex gap-4 items-center flex-wrap">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
                <div className="h-4 w-16 bg-gray-200 rounded ml-4"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
              </div>
              <div className="flex gap-4 items-center flex-wrap">
                <div className="h-4 w-16 bg-gray-200 rounded"></div>
                <div className="h-10 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-center justify-between mb-8">
              <div className="flex gap-4 items-center flex-wrap">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="all">All</option>
                  {availableCategories.map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <label className="text-sm font-medium text-gray-700 ml-4">Job Type:</label>
                <select
                  value={jobTypeFilter}
                  onChange={e => setJobTypeFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="all">All</option>
                  {availableJobTypes.map((type: string) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <label className="text-sm font-medium text-gray-700 ml-4">Region:</label>
                <select
                  value={regionFilter}
                  onChange={e => setRegionFilter(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="all">All</option>
                  {availableRegions.map((region: string) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 items-center flex-wrap">
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading}
                  >
                    Clear {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
                  </button>
                )}
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as WorkFilters['sortBy'])}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="payrate-desc">Highest Pay</option>
                </select>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading work opportunities...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Opportunities</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={refetch}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && filteredWorkItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Briefcase className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Results Found' : 'No Work Opportunities Yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `No opportunities match "${searchTerm}"`
                  : 'Be the first to post a work opportunity!'}
              </p>
              {!searchTerm && (
                <Link href="/work/create" className="btn-primary">
                  Post an Opportunity →
                </Link>
              )}
            </div>
          )}

          {!isLoading && !error && filteredWorkItems.length > 0 && (
            <>
              {/* Featured Opportunities */}
              {featured.length > 0 && (
                <div className="mb-16">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-3xl font-serif font-bold text-purple-800 flex items-center gap-2">
                      <TrendingUp className="w-8 h-8" />
                      Featured Opportunities
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {featured.map((item) => (
                      <UnifiedWorkCard
                        key={item.id}
                        work={toUnifiedData(item)}
                        variant="explore"
                        featured={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Opportunities Grid */}
              {grid.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-serif font-bold text-purple-800">
                      {featured.length > 0 ? 'More Opportunities' : 'All Opportunities'}
                    </h2>
                    <span className="text-gray-600">
                      {grid.length} opportunit{grid.length === 1 ? 'y' : 'ies'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grid.map((item) => (
                      <UnifiedWorkCard
                        key={item.id}
                        work={toUnifiedData(item)}
                        variant="explore"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="btn-outline flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Load More
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
              Have a Project or Job Opening?
            </h2>
            <p className="text-lg mb-8 text-purple-50">
              Connect with talented digital nomads and remote workers around the world. 
              Post your opportunity and find the perfect match for your project.
            </p>
            <Link
              href="/work/create"
              className="btn-primary inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50"
            >
              <Briefcase className="w-5 h-5" />
              Post a Work Opportunity
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
