/**
 * Zustand store for public shop browsing
 * Centralized state for browsing marketplace products
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ProductCardData } from '@/types/shop';

// Type alias for consistency
export type ShopProduct = ProductCardData;

export interface ShopState {
  // Products
  products: ShopProduct[];
  isLoadingProducts: boolean;
  productsError: string | null;
  
  // UI State
  searchQuery: string;
  selectedCategory: string;
  selectedCondition: string;
  priceRange: { min: number; max: number };
  sortBy: 'newest' | 'oldest' | 'price-low' | 'price-high';
  viewMode: 'grid' | 'list';
  
  // Actions
  setProducts: (products: ShopProduct[]) => void;
  setLoadingProducts: (loading: boolean) => void;
  setProductsError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  setSelectedCondition: (condition: string) => void;
  setPriceRange: (range: { min: number; max: number }) => void;
  setSortBy: (sortBy: 'newest' | 'oldest' | 'price-low' | 'price-high') => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  
  // Computed getters
  getFilteredProducts: () => ShopProduct[];
  getProductById: (id: string) => ShopProduct | undefined;
  getProductsByCategory: (category: string) => ShopProduct[];
  searchProducts: (query: string) => ShopProduct[];
  clearFilters: () => void;
  reset: () => void;
}

export const useShopStore = create<ShopState>()(
  devtools(
    (set, get) => ({
      // Initial state
      products: [],
      isLoadingProducts: false,
      productsError: null,
      
      searchQuery: '',
      selectedCategory: '',
      selectedCondition: '',
      priceRange: { min: 0, max: 1000000 },
      sortBy: 'newest',
      viewMode: 'grid',
      
      // Product actions
      setProducts: (products) => set({ products }),
      
      setLoadingProducts: (loading) => set({ isLoadingProducts: loading }),
      
      setProductsError: (error) => set({ productsError: error }),
      
      // UI actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      
      setSelectedCondition: (condition) => set({ selectedCondition: condition }),
      
      setPriceRange: (range) => set({ priceRange: range }),
      
      setSortBy: (sortBy) => set({ sortBy }),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      // Computed getters
      getFilteredProducts: () => {
        const state = get();
        let filtered = [...state.products];
        
        // Filter by search query
        if (state.searchQuery.trim()) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(product =>
            product.title.toLowerCase().includes(query) ||
            product.description.toLowerCase().includes(query) ||
            product.tags.some(tag => tag.toLowerCase().includes(query)) ||
            product.category.toLowerCase().includes(query) ||
            product.location.toLowerCase().includes(query)
          );
        }
        
        // Filter by category
        if (state.selectedCategory) {
          filtered = filtered.filter(product => product.category === state.selectedCategory);
        }
        
        // Filter by condition
        if (state.selectedCondition) {
          filtered = filtered.filter(product => product.condition === state.selectedCondition);
        }
        
        // Filter by price range
        filtered = filtered.filter(product => 
          product.price >= state.priceRange.min && 
          product.price <= state.priceRange.max
        );
        
        // Sort products
        filtered.sort((a, b) => {
          switch (state.sortBy) {
            case 'newest':
              return b.createdAt - a.createdAt;
            case 'oldest':
              return a.createdAt - b.createdAt;
            case 'price-low':
              return a.price - b.price;
            case 'price-high':
              return b.price - a.price;
            default:
              return 0;
          }
        });
        
        return filtered;
      },
      
      getProductById: (id) => {
        const state = get();
        return state.products.find(product => product.id === id);
      },
      
      getProductsByCategory: (category) => {
        const state = get();
        return state.products.filter(product => 
          product.category.toLowerCase() === category.toLowerCase()
        );
      },
      
      searchProducts: (query) => {
        const state = get();
        const lowercaseQuery = query.toLowerCase();
        return state.products.filter(product =>
          product.title.toLowerCase().includes(lowercaseQuery) ||
          product.description.toLowerCase().includes(lowercaseQuery) ||
          product.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
          product.category.toLowerCase().includes(lowercaseQuery) ||
          product.location.toLowerCase().includes(lowercaseQuery)
        );
      },
      
      // Utility actions
      clearFilters: () => set({
        searchQuery: '',
        selectedCategory: '',
        selectedCondition: '',
        priceRange: { min: 0, max: 1000000 },
        sortBy: 'newest'
      }),
      
      reset: () => set({
        products: [],
        isLoadingProducts: false,
        productsError: null,
        searchQuery: '',
        selectedCategory: '',
        selectedCondition: '',
        priceRange: { min: 0, max: 1000000 },
        sortBy: 'newest',
        viewMode: 'grid'
      })
    }),
    {
      name: 'shop-store'
    }
  )
);
