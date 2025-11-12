/**
 * Date and time utility functions
 * Extracted from business services for proper separation of concerns
 */

/**
 * Calculate relative time string from timestamp
 * 
 * @param timestamp - Unix timestamp in seconds
 * @returns Human-readable relative time string (e.g., "2 hours ago", "just now")
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  const minute = 60;
  const hour = minute * 60;
  const day = hour * 24;
  const week = day * 7;
  const month = day * 30;
  const year = day * 365;
  
  if (diff < minute) return 'just now';
  if (diff < hour) return `${Math.floor(diff / minute)} minutes ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hours ago`;
  if (diff < week) return `${Math.floor(diff / day)} days ago`;
  if (diff < month) return `${Math.floor(diff / week)} weeks ago`;
  if (diff < year) return `${Math.floor(diff / month)} months ago`;
  return `${Math.floor(diff / year)} years ago`;
}

/**
 * Format timestamp to readable date string
 * 
 * @param timestamp - Unix timestamp in seconds
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string
 */
export function formatDate(timestamp: number, locale: string = 'en-US'): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format timestamp to readable datetime string
 * 
 * @param timestamp - Unix timestamp in seconds
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted datetime string
 */
export function formatDateTime(timestamp: number, locale: string = 'en-US'): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
