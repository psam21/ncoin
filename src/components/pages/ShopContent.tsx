'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Search,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Grid3x3,
  List,
  Tag,
  Package,
  ArrowRight,
  Store,
} from 'lucide-react';

import { usePublicProducts } from '@/hooks/usePublicProducts';
import { useShopStore } from '@/stores/useShopStore';
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '@/config/shop';
import { UnifiedProductCard } from '@/components/generic/UnifiedProductCard';

export default function ShopContent() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Shop store with filters
  const {
    searchQuery,
    selectedCategory,
    selectedCondition,
    priceRange,
    sortBy,
    setSearchQuery,
    setSelectedCategory,
    setSelectedCondition,
    setPriceRange,
    setSortBy,
    clearFilters,
    getFilteredProducts,
  } = useShopStore();

  // Hook to fetch public products
  const {
    isLoading,
    error,
    loadMore,
    refresh,
    isLoadingMore,
    hasMore,
  } = usePublicProducts();

  // Get filtered products from store
  const products = getFilteredProducts();
  
  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedCategory && selectedCategory !== 'all') count++;
    if (selectedCondition && selectedCondition !== 'all') count++;
    if (priceRange.min > 0 || priceRange.max < Infinity) count++;
    return count;
  }, [searchQuery, selectedCategory, selectedCondition, priceRange]);

  // Featured products (first 2)
  const featured = products.slice(0, 2);
  const grid = products.slice(2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      {/* Hero Section */}
      <section className="pt-0 pb-16 md:pb-20 bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              Nomad Marketplace
            </h1>
            <p className="text-lg text-purple-50 max-w-2xl mx-auto mb-8">
              Buy and sell products, services, and items with the digital nomad community. 
              Discover gear, services, and local finds from nomads around the world.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="Real products from real nomads"
              >
                <Package className="w-4 h-4 mr-2 text-white" />
                <span>Real Products</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="Direct peer-to-peer transactions"
              >
                <Store className="w-4 h-4 mr-2 text-white" />
                <span>P2P Marketplace</span>
              </div>
              <div
                className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm"
                title="Browse products by category and condition"
              >
                <Tag className="w-4 h-4 mr-2 text-white" />
                <span>Smart Filters</span>
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
                placeholder="Search products, categories, or locations..."
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
              {/* Left side: Category, Condition, Price filters */}
              <div className="flex gap-4 items-center flex-wrap">
                <label className="text-sm font-medium text-gray-700">Category:</label>
                <select
                  value={selectedCategory || 'all'}
                  onChange={e => setSelectedCategory(e.target.value === 'all' ? '' : e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="all">All</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                <label className="text-sm font-medium text-gray-700 ml-4">Condition:</label>
                <select
                  value={selectedCondition || 'all'}
                  onChange={e => setSelectedCondition(e.target.value === 'all' ? '' : e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="all">All</option>
                  {PRODUCT_CONDITIONS.map((cond) => (
                    <option key={cond.id} value={cond.id}>{cond.name}</option>
                  ))}
                </select>

                <label className="text-sm font-medium text-gray-700 ml-4">Price Range:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min === 0 ? '' : priceRange.min}
                    onChange={(e) => setPriceRange({ 
                      ...priceRange, 
                      min: e.target.value ? parseFloat(e.target.value) : 0 
                    })}
                    className="w-24 border border-gray-300 rounded px-3 py-2 text-sm"
                    min="0"
                  />
                  <span className="text-gray-500">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max === Infinity ? '' : priceRange.max}
                    onChange={(e) => setPriceRange({ 
                      ...priceRange, 
                      max: e.target.value ? parseFloat(e.target.value) : Infinity 
                    })}
                    className="w-24 border border-gray-300 rounded px-3 py-2 text-sm"
                    min="0"
                  />
                </div>
              </div>

              {/* Right side: View mode, Clear filters, Sort */}
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

                {/* View Mode Toggle */}
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    title="Grid View"
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as 'newest' | 'oldest' | 'price-low' | 'price-high')}
                  className="border border-gray-300 rounded px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading products...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Products</h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={refresh}
                className="btn-primary"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <ShoppingBag className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || activeFilterCount > 0 ? 'No Products Found' : 'No Products Yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || activeFilterCount > 0
                  ? 'Try adjusting your filters or search terms'
                  : 'Be the first to list a product!'}
              </p>
              {!searchQuery && activeFilterCount === 0 && (
                <Link href="/shop/create" className="btn-primary">
                  List Your Product →
                </Link>
              )}
            </div>
          )}

          {/* Products Grid/List */}
          {!isLoading && !error && products.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-serif font-bold text-purple-800">
                  Products from the Nomad Community
                </h2>
                <div className="text-gray-600">
                  {searchQuery || activeFilterCount > 0
                    ? `${products.length} result${products.length !== 1 ? 's' : ''}`
                    : `${products.length} product${products.length !== 1 ? 's' : ''}`}
                </div>
              </div>

              {/* Featured Products (first 2) */}
              {featured.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl font-serif font-bold text-purple-800 mb-6">
                    Featured Products
                  </h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    {featured.map((product) => (
                      <UnifiedProductCard 
                        key={product.id} 
                        product={product} 
                        variant="shop"
                        featured 
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* More Products */}
              {grid.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-serif font-bold text-purple-800 mb-6">
                    More Products
                  </h3>
                  <div className={viewMode === 'grid' 
                    ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                  }>
                    {grid.slice(0, 8).map((product) => (
                      <UnifiedProductCard 
                        key={product.id} 
                        product={product} 
                        variant="shop"
                        viewMode={viewMode}
                      />
                    ))}
                    {/* See More Card (only in grid mode) */}
                    {viewMode === 'grid' && grid.length > 8 && (
                      <div className="culture-card group cursor-pointer bg-gradient-to-br from-purple-50 to-orange-50 transition-all duration-300 flex flex-col items-center justify-center p-8 min-h-[400px]">
                        <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                          <ArrowRight className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-2xl font-serif font-bold text-purple-800 mb-2 text-center">
                          See More Products
                        </h3>
                        <p className="text-gray-600 text-center mb-4">
                          Explore all products from the marketplace
                        </p>
                        <span className="text-orange-600 font-semibold group-hover:text-orange-700 transition-colors duration-200 flex items-center">
                          View All Products
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Load More Button */}
              {hasMore && !searchQuery && activeFilterCount === 0 && (
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
                        Load More Products
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
              Have Something to List?
            </h2>
            <p className="text-lg mb-8 text-purple-50">
              Join the nomad marketplace and connect with buyers around the world. 
              List your products and services to reach the digital nomad community.
            </p>
            <Link
              href="/my-shop/create"
              className="btn-primary inline-flex items-center gap-2 bg-white text-purple-600 hover:bg-purple-50"
            >
              <ShoppingBag className="w-5 h-5" />
              List Your Product or Service
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
