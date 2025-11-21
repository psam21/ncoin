'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Layers,
  Activity,
  Play,
  Headphones,
  Image as ImageIcon,
  ArrowRight,
  Loader2,
  AlertCircle,
  Globe,
} from 'lucide-react';

import { useExploreContributions, type ContributionFilters } from '@/hooks/useExploreContributions';
import { UnifiedContributionCard, UnifiedContributionData } from '@/components/generic/UnifiedContributionCard';
import type { ContributionExploreItem } from '@/services/business/ContributionService';

// Adapter: Convert ContributionExploreItem to UnifiedContributionData
function toUnifiedData(item: ContributionExploreItem): UnifiedContributionData {
  return {
    id: item.id,
    dTag: item.dTag,
    title: item.name, // ContributionExploreItem uses 'name' instead of 'title'
    description: item.description,
    contributionType: '', // Not present in ContributionExploreItem
    category: item.category,
    location: item.location,
    region: item.region,
    country: undefined,
    imageUrl: item.image, // ContributionExploreItem uses 'image' instead of 'imageUrl'
    tags: item.tags,
    pubkey: item.pubkey,
    createdAt: item.publishedAt, // ContributionExploreItem uses 'publishedAt' instead of 'createdAt'
    contributors: item.contributors,
    mediaCount: item.mediaCount,
    relativeTime: item.relativeTime,
  };
}

export default function ExploreContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title-asc' | 'title-desc'>('newest');

  // Build filters object
  const filters: ContributionFilters = useMemo(() => ({
    searchTerm,
    category: categoryFilter,
    region: regionFilter,
    sortBy,
  }), [searchTerm, categoryFilter, regionFilter, sortBy]);

  const {
    contributionItems,
    isLoading,
    error,
    refetch,
    loadMore,
    isLoadingMore,
    hasMore,
    availableCategories,
    availableRegions,
    activeFilterCount,
  } = useExploreContributions(filters);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setRegionFilter('all');
    setSortBy('newest');
  };

  const featured = contributionItems.slice(0, 2);
  const grid = contributionItems.slice(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <section className="pt-0 pb-16 md:pb-20 bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Explore Nomad Contributions
            </h1>
            <p className="text-lg text-purple-50 max-w-2xl mx-auto mb-8">
              Discover inspiring contributions, experiences, and wisdom from digital nomads around the world. 
              Connect with the global nomad community through shared adventures.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="Multiple dimensions of cultural data"
              >
                <Layers className="w-4 h-4 mr-2 text-white" />
                <span>Real Contributions</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="Real-time updates from the nomad community"
              >
                <Activity className="w-4 h-4 mr-2 text-white" />
                <span>Live Updates</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="Photos, videos, and audio from nomad journeys"
              >
                <Play className="w-4 h-4 mr-1 text-white" />
                <Headphones className="w-4 h-4 -ml-1 mr-1 text-white" />
                <ImageIcon className="w-4 h-4 -ml-1 mr-2 text-white" />
                <span>Rich Media</span>
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
                placeholder="Search contributions, locations, or nomad experiences..."
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
                  onChange={e => setSortBy(e.target.value as 'newest' | 'oldest' | 'title-asc' | 'title-desc')}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                </select>
              </div>
            </div>
          )}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading nomad contributions...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Contributions</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={refetch}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          )}

          {!isLoading && !error && contributionItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Globe className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Results Found' : 'No Contributions Yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm 
                  ? `No contributions match "${searchTerm}"`
                  : 'Be the first to share your nomad journey!'}
              </p>
              {!searchTerm && (
                <Link href="/contribute" className="btn-primary">
                  Share Your Contribution →
                </Link>
              )}
            </div>
          )}

          {!isLoading && !error && contributionItems.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold text-purple-800">
                  Nomad Contributions from Around the World
                </h2>
                <div className="text-gray-600">
                  {searchTerm 
                    ? `${contributionItems.length} result${contributionItems.length !== 1 ? 's' : ''}`
                    : `${contributionItems.length} contribution${contributionItems.length !== 1 ? 's' : ''}`}
                </div>
              </div>

              {featured.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl font-serif font-bold text-purple-800 mb-6">
                    Featured Nomad Contributions
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    {featured.map((item) => (
                      <UnifiedContributionCard 
                        key={item.id} 
                        contribution={toUnifiedData(item)} 
                        variant="explore"
                        featured 
                      />
                    ))}
                  </div>
                </div>
              )}

              {grid.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-serif font-bold text-purple-800 mb-6">
                    More Nomad Contributions
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {grid.slice(0, 5).map((item) => (
                      <UnifiedContributionCard 
                        key={item.id} 
                        contribution={toUnifiedData(item)} 
                        variant="explore"
                      />
                    ))}
                    {/* See More Card */}
                    <div className="culture-card group cursor-pointer bg-gradient-to-br from-purple-50 to-orange-50 transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[400px]">
                      <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <ArrowRight className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-serif font-bold text-purple-800 mb-2 text-center">
                        See More Contributions
                      </h3>
                      <p className="text-gray-600 text-center mb-4">
                        Explore all nomad contributions and experiences
                      </p>
                      <span className="text-orange-600 font-semibold group-hover:text-orange-700 transition-colors duration-200 flex items-center">
                        View All Contributions
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {hasMore && !searchTerm && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Loading More...
                      </>
                    ) : (
                      <>
                        Load More Contributions
                        <ArrowRight className="w-5 h-5 ml-2" />
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
              Have an Experience to Share?
            </h2>
            <p className="text-lg mb-8 text-purple-50">
              Connect with the global nomad community by sharing your unique experiences, 
              traditions, and stories. Inspire others on their journey.
            </p>
            <Link
              href="/contribute"
              className="btn-primary inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50"
            >
              <Globe className="w-5 h-5" />
              Share Your Contribution
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
