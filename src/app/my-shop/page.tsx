'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { useMyShopProducts } from '@/hooks/useMyShopProducts';
import { useMyShopStore } from '@/stores/useMyShopStore';
import { UnifiedProductCard } from '@/components/generic/UnifiedProductCard';
import { DeleteConfirmationModal } from '@/components/generic/DeleteConfirmationModal';
import { ProductCardData } from '@/types/shop';
import { PRODUCT_CATEGORIES, PRODUCT_CONDITIONS } from '@/config/shop';
import { logger } from '@/services/core/LoggingService';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { deleteProduct, fetchProductById } from '@/services/business/ShopService';
import { Store, Plus, Search, Filter } from 'lucide-react';

export default function MyShopPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isHydrated = useAuthHydration();
  const { getSigner } = useNostrSigner();
  
  // Debug logging to track auth state
  useEffect(() => {
    logger.info('MyShopPage render state', {
      service: 'MyShopPage',
      method: 'render',
      isHydrated,
      hasUser: !!user,
      userPubkey: user?.pubkey?.substring(0, 8) + '...' || 'none',
    });
  }, [isHydrated, user]);
  
  // Hooks
  const { isLoading: isLoadingProducts, error: loadError } = useMyShopProducts();
  const {
    myProducts,
    isDeleting,
    deleteError,
    removeProduct,
    startEditing,
    showDeleteDialog,
    openDeleteDialog,
    hideDeleteDialog,
    deletingProduct,
  } = useMyShopStore();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');

  // Filter products
  const filteredProducts = useMemo(() => {
    return myProducts.filter(product => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;

      // Condition filter
      const matchesCondition = conditionFilter === 'all' || product.condition === conditionFilter;

      return matchesSearch && matchesCategory && matchesCondition;
    });
  }, [myProducts, searchQuery, categoryFilter, conditionFilter]);

  // Statistics
  const statistics = useMemo(() => {
    const byCategory: Record<string, number> = {};
    const byCondition: Record<string, number> = {};
    let totalValue = 0;

    myProducts.forEach(product => {
      // Count by category
      byCategory[product.category] = (byCategory[product.category] || 0) + 1;

      // Count by condition
      byCondition[product.condition] = (byCondition[product.condition] || 0) + 1;

      // Calculate total value (in USD equivalent for simplicity)
      if (product.currency === 'USD') {
        totalValue += product.price;
      }
    });

    return {
      total: myProducts.length,
      byCategory,
      byCondition,
      totalValue,
    };
  }, [myProducts]);

  // Handlers
  const handleEdit = (product: ProductCardData) => {
    startEditing(product);
    router.push(`/my-shop/edit/${product.dTag}`);
  };

  const handleDelete = (product: ProductCardData) => {
    openDeleteDialog(product);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setConditionFilter('all');
  };

  const handleDeleteConfirm = async () => {
    if (!deletingProduct || !user?.pubkey) return;

    try {
      // Get signer
      const signer = await getSigner();
      if (!signer) {
        alert('Please connect a Nostr signer to delete products');
        return;
      }

      // Fetch full product to get eventId
      const fullProduct = await fetchProductById(deletingProduct.dTag);
      
      if (!fullProduct) {
        throw new Error('Failed to fetch product for deletion');
      }
      
      // Delete product
      const result = await deleteProduct(
        fullProduct.id, // eventId
        signer,
        user.pubkey,
        fullProduct.title
      );

      if (result.success) {
        // Remove from local state
        removeProduct(deletingProduct.id);
        hideDeleteDialog();
      } else {
        throw new Error(result.error || 'Failed to delete product');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete product';
      logger.error('Error deleting product', err instanceof Error ? err : new Error(errorMsg), {
        service: 'MyShopPage',
        method: 'handleDeleteConfirm',
      });
      alert(`Error: ${errorMsg}`);
    }
  };

  // Wait for hydration before checking auth to prevent false negatives
  if (!isHydrated) {
    logger.info('MyShopPage: Waiting for auth hydration', {
      service: 'MyShopPage',
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
    logger.warn('MyShopPage: No user after hydration, showing sign-in required', {
      service: 'MyShopPage',
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
              You need to sign in to manage your shop.
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
              <h1 className="text-3xl font-serif font-bold text-primary-900 mb-2 flex items-center gap-3">
                <Store className="w-8 h-8" />
                My Shop
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your products and listings
              </p>
            </div>
            <div className="mt-4 lg:mt-0">
              <button
                onClick={() => router.push('/my-shop/create')}
                className="btn-primary-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                List New Product
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-width py-8">
        {/* Statistics Dashboard */}
        {!isLoadingProducts && !loadError && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Total Products */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  <p className="text-3xl font-bold text-primary-900 mt-1">{statistics.total}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-full">
                  <Store className="w-6 h-6 text-primary-600" />
                </div>
              </div>
            </div>

            {/* By Category */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm font-medium text-gray-600 mb-3">By Category</p>
              <div className="space-y-2">
                {Object.entries(statistics.byCategory).slice(0, 3).map(([category, count]) => {
                  const cat = PRODUCT_CATEGORIES.find(c => c.id === category);
                  return (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{cat?.name || category}</span>
                      <span className="font-semibold text-primary-900">{count}</span>
                    </div>
                  );
                })}
                {Object.keys(statistics.byCategory).length > 3 && (
                  <p className="text-xs text-gray-500 pt-1">+{Object.keys(statistics.byCategory).length - 3} more</p>
                )}
              </div>
            </div>

            {/* By Condition */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <p className="text-sm font-medium text-gray-600 mb-3">By Condition</p>
              <div className="space-y-2">
                {Object.entries(statistics.byCondition).map(([condition, count]) => {
                  const cond = PRODUCT_CONDITIONS.find(c => c.id === condition);
                  return (
                    <div key={condition} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{cond?.name || condition}</span>
                      <span className="font-semibold text-primary-900">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Value */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Est. Total Value</p>
                  <p className="text-2xl font-bold text-primary-900 mt-1">${statistics.totalValue.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-1">USD listings only</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!isLoadingProducts && !loadError && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter Your Products
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
                placeholder="Search by title, description, or tags..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {PRODUCT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Condition Filter */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                  Condition
                </label>
                <select
                  id="condition"
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Conditions</option>
                  {PRODUCT_CONDITIONS.map(cond => (
                    <option key={cond.id} value={cond.id}>{cond.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> of <span className="font-semibold text-gray-900">{myProducts.length}</span> products
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingProducts && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your products...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Products</h3>
                <p className="text-red-600 mt-1">{loadError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {!isLoadingProducts && !loadError && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts.map(product => (
              <UnifiedProductCard 
                key={product.id} 
                product={product}
                variant="my-shop"
                onEdit={() => handleEdit(product)}
                onDelete={() => handleDelete(product)}
              />
            ))}
          </div>
        )}

        {/* No Results State (when filters applied but no matches) */}
        {!isLoadingProducts && !loadError && myProducts.length > 0 && filteredProducts.length === 0 && (
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

        {/* Empty State (no products at all) */}
        {!isLoadingProducts && !loadError && myProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="text-primary-300 mb-4">
              <Store className="w-20 h-20 mx-auto" />
            </div>
            <h3 className="text-2xl font-serif font-bold text-primary-800 mb-2">No products yet</h3>
            <p className="text-gray-600 mb-6 text-lg">
              Start listing products in your shop
            </p>
            <button 
              onClick={() => router.push('/my-shop/create')}
              className="btn-primary-sm flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              List Your First Product
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteDialog}
        onClose={hideDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title={deletingProduct?.title || ''}
        message="This will publish a deletion event to Nostr relays. This action cannot be undone."
        isDeleting={isDeleting}
      />

      {/* Delete Error Display */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">Delete Failed</h4>
              <p className="text-sm text-red-600 mt-1">{deleteError}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
