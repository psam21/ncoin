/**
 * Zustand store for My Shop (user's products management)
 * Centralized state for managing user's own marketplace products
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { ProductCardData, ProductPublishingProgress } from '@/types/shop';

// Type alias for consistency
export type ShopProduct = ProductCardData;

export interface MyShopState {
  // Products
  myProducts: ShopProduct[];
  isLoadingMyProducts: boolean;
  myProductsError: string | null;
  
  // Editing
  editingProduct: ShopProduct | null;
  isEditing: boolean;
  isUpdating: boolean;
  updateProgress: ProductPublishingProgress | null;
  updateError: string | null;
  
  // Deleting
  isDeleting: boolean;
  deleteProgress: ProductPublishingProgress | null;
  deleteError: string | null;
  
  // UI State
  showCreateForm: boolean;
  showDeleteDialog: boolean;
  deletingProduct: ShopProduct | null;
  
  // Actions
  setMyProducts: (products: ShopProduct[]) => void;
  setLoadingMyProducts: (loading: boolean) => void;
  setMyProductsError: (error: string | null) => void;
  
  // Edit actions
  startEditing: (product: ShopProduct) => void;
  cancelEditing: () => void;
  setUpdating: (updating: boolean) => void;
  setUpdateProgress: (progress: ProductPublishingProgress | null) => void;
  setUpdateError: (error: string | null) => void;
  
  // Delete actions
  setDeleting: (deleting: boolean) => void;
  setDeleteProgress: (progress: ProductPublishingProgress | null) => void;
  setDeleteError: (error: string | null) => void;
  
  // Create form actions
  openCreateForm: () => void;
  hideCreateForm: () => void;
  
  // Delete dialog actions
  openDeleteDialog: (product: ShopProduct) => void;
  hideDeleteDialog: () => void;
  
  // Utility actions
  addProduct: (product: ShopProduct) => void;
  updateProduct: (productId: string, updatedProduct: ShopProduct) => void;
  removeProduct: (productId: string) => void;
  clearErrors: () => void;
  reset: () => void;
}

export const useMyShopStore = create<MyShopState>()(
  devtools(
    (set) => ({
      // Initial state
      myProducts: [],
      isLoadingMyProducts: false,
      myProductsError: null,
      editingProduct: null,
      isEditing: false,
      isUpdating: false,
      updateProgress: null,
      updateError: null,
      isDeleting: false,
      deleteProgress: null,
      deleteError: null,
      showCreateForm: false,
      showDeleteDialog: false,
      deletingProduct: null,
      
      // Product management actions
      setMyProducts: (products: ShopProduct[]) => set({ myProducts: products }),
      setLoadingMyProducts: (loading: boolean) => set({ isLoadingMyProducts: loading }),
      setMyProductsError: (error: string | null) => set({ myProductsError: error }),
      
      // Edit actions
      startEditing: (product: ShopProduct) => set({ 
        editingProduct: product, 
        isEditing: true,
        updateError: null 
      }),
      
      cancelEditing: () => set({ 
        editingProduct: null, 
        isEditing: false,
        updateError: null,
        updateProgress: null
      }),
      
      setUpdating: (updating: boolean) => set({ isUpdating: updating }),
      setUpdateProgress: (progress: ProductPublishingProgress | null) => set({ updateProgress: progress }),
      setUpdateError: (error: string | null) => set({ updateError: error }),
      
      // Delete actions
      setDeleting: (deleting: boolean) => set({ isDeleting: deleting }),
      setDeleteProgress: (progress: ProductPublishingProgress | null) => set({ deleteProgress: progress }),
      setDeleteError: (error: string | null) => set({ deleteError: error }),
      
      // Create form actions
      openCreateForm: () => set({ showCreateForm: true }),
      hideCreateForm: () => set({ showCreateForm: false }),
      
      // Delete dialog actions
      openDeleteDialog: (product: ShopProduct) => set({ 
        showDeleteDialog: true, 
        deletingProduct: product,
        deleteError: null
      }),
      hideDeleteDialog: () => set({ 
        showDeleteDialog: false, 
        deletingProduct: null,
        deleteError: null
      }),
      
      // Utility actions
      addProduct: (product: ShopProduct) => set((state) => ({
        myProducts: [product, ...state.myProducts] // Add to beginning (newest first)
      })),
      
      updateProduct: (productId: string, updatedProduct: ShopProduct) => set((state) => ({
        myProducts: state.myProducts.map(p => 
          p.id === productId ? updatedProduct : p
        )
      })),
      
      removeProduct: (productId: string) => set((state) => ({
        myProducts: state.myProducts.filter(p => p.id !== productId)
      })),
      
      clearErrors: () => set({
        myProductsError: null,
        updateError: null,
        deleteError: null
      }),
      
      reset: () => set({
        myProducts: [],
        isLoadingMyProducts: false,
        myProductsError: null,
        editingProduct: null,
        isEditing: false,
        isUpdating: false,
        updateProgress: null,
        updateError: null,
        isDeleting: false,
        deleteProgress: null,
        deleteError: null,
        showCreateForm: false,
        showDeleteDialog: false,
        deletingProduct: null
      })
    }),
    {
      name: 'my-shop-store'
    }
  )
);
