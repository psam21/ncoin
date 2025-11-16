export const PRODUCT_CATEGORIES = [
  { id: 'art', name: 'Art & Collectibles', icon: '🎨' },
  { id: 'services', name: 'Services', icon: '⚙️' },
  { id: 'hardware', name: 'Hardware', icon: '💻' },
  { id: 'software', name: 'Software', icon: '📱' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'fashion', name: 'Fashion', icon: '👕' },
  { id: 'food', name: 'Food & Drink', icon: '🍕' },
  { id: 'home', name: 'Home & Garden', icon: '🏠' },
  { id: 'sports', name: 'Sports & Outdoors', icon: '⚽' },
  { id: 'other', name: 'Other', icon: '📦' },
];

export const PRODUCT_CONDITIONS = [
  { id: 'new', name: 'New', description: 'Brand new, never used' },
  { id: 'used', name: 'Used', description: 'Previously used, good condition' },
  { id: 'refurbished', name: 'Refurbished', description: 'Professionally restored' },
];

export const CURRENCIES = [
  { id: 'BTC', name: 'Bitcoin (BTC)', symbol: '₿' },
  { id: 'sats', name: 'Satoshis (sats)', symbol: 'sats' },
  { id: 'USD', name: 'US Dollar (USD)', symbol: '$' },
];

export function getProductCategories() {
  return PRODUCT_CATEGORIES;
}

export function getProductConditions() {
  return PRODUCT_CONDITIONS;
}

export function getCurrencies() {
  return CURRENCIES;
}
