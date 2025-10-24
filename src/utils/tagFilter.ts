
// Technical tags that should not be displayed to users
const HIDDEN_TAGS = [
  'culture-bridge-shop',
  'culture-bridge-heritage-contribution',
  'product-deletion',
];

export const filterVisibleTags = (tags: string[]): string[] => {
  return tags.filter(tag => !HIDDEN_TAGS.includes(tag));
};

export const isHiddenTag = (tag: string): boolean => {
  return HIDDEN_TAGS.includes(tag);
};
