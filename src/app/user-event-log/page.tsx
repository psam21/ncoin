'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { EventTable } from '@/components/pages/EventTable';

interface UserEventData {
  npub: string;
  eventId: string;
  eventKind: number;
  createdTimestamp: number;
  processedTimestamp: number;
  processingDuration: number;
  totalRelaysAttempted: number;
  successfulRelays: string[];
  failedRelays: string[];
  failedRelayReasons?: Record<string, string>;
  verifiedRelays?: string[];
  silentFailureRelays?: string[];
  unverifiedRelays?: string[];
  verificationTimestamp?: number;
  averageResponseTime: number;
  tagsCount: number;
  retryAttempts: number;
}

interface PaginatedEventResponse {
  events: UserEventData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserEventLogPage() {
  const [events, setEvents] = useState<UserEventData[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [sortField, setSortField] = useState<keyof UserEventData>('processedTimestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchEvents = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/get-all-events?page=${page}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data: PaginatedEventResponse = await response.json();
      setEvents(data.events);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Failed to fetch events:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchEvents();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchEvents(pagination.page);
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, pagination.page]);

  const getSuccessRate = (event: UserEventData): number => {
    if (event.totalRelaysAttempted === 0) return 0;
    return Math.round((event.successfulRelays.length / event.totalRelaysAttempted) * 100);
  };

  const handleSort = (field: keyof UserEventData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedEvents = [...events].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    // Handle array comparisons (like failedRelays)
    if (Array.isArray(aValue) && Array.isArray(bValue)) {
      const comparison = aValue.length - bValue.length;
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    // Handle number and string comparisons
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="pt-16 lg:pt-20 pb-16 md:pb-20 bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Activity className="w-12 h-12 mr-4" />
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold">
                Global Event Activity
              </h1>
            </div>
            <p className="text-lg text-purple-50 max-w-2xl mx-auto mb-8">
              Real-time Nostr event publishing analytics from all users. Monitor relay performance and event success rates.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm">
                <CheckCircle className="w-4 h-4 mr-2 text-white" />
                <span>Success Tracking</span>
              </div>
              <div className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm">
                <Zap className="w-4 h-4 mr-2 text-white" />
                <span>Real-time</span>
              </div>
              <div className="flex items-center text-sm font-medium bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 shadow-sm">
                <Clock className="w-4 h-4 mr-2 text-white" />
                <span>Auto-refresh</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                Auto-refresh (30s)
              </label>

              <button
                onClick={() => fetchEvents(pagination.page)}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          {events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                  <Activity className="h-4 w-4" />
                  <span>Total Events</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                  <CheckCircle className="h-4 w-4" />
                  <span>Avg Success Rate</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(events.reduce((acc, e) => acc + getSuccessRate(e), 0) / events.length)}%
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  <span>Avg Processing</span>
                </div>
                <p className="text-2xl font-bold text-primary-600">
                  {Math.round(events.reduce((acc, e) => acc + e.processingDuration, 0) / events.length)}ms
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                  <Zap className="h-4 w-4" />
                  <span>Avg Response</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(events.reduce((acc, e) => acc + e.averageResponseTime, 0) / events.length)}ms
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="h-5 w-5" />
              <p className="font-medium">Error loading events</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && events.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && events.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600">
                No Nostr events have been published yet. Events will appear here once users start publishing content.
              </p>
            </div>
          </div>
        )}

        {/* Events Table */}
        {events.length > 0 && (
          <>
            <EventTable 
              events={sortedEvents}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-4 px-6 py-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} events
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchEvents(pagination.page - 1)}
                    disabled={pagination.page === 1 || isLoading}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchEvents(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || isLoading}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
