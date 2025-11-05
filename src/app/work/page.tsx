'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Briefcase, Search, Filter, MapPin, Clock, DollarSign, Star, Grid, List } from 'lucide-react';

interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  type: 'Remote' | 'On-site' | 'Hybrid';
  duration: string;
  payRate: number;
  currency: 'BTC' | 'sats' | 'USD' | 'per hour' | 'per day';
  category: string;
  postedDate: Date;
  rating?: number;
  poster: string;
}

export default function GigsPage() {
  const isHydrated = useAuthHydration();
  const { isAuthenticated } = useAuthStore();
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Sample jobs - in real app this would come from API/Nostr
  const [jobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Frontend Developer',
      description: 'Build responsive web interfaces using React and TypeScript',
      company: 'Tech Startup',
      location: 'Remote',
      type: 'Remote',
      duration: '3 months',
      payRate: 50,
      currency: 'per hour',
      category: 'Development',
      postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      rating: 4.8,
      poster: 'tech_recruiter',
    },
    {
      id: '2',
      title: 'Content Writer',
      description: 'Create engaging Bitcoin and crypto-related content',
      company: 'Crypto Media',
      location: 'Remote',
      type: 'Remote',
      duration: '1 month',
      payRate: 100000,
      currency: 'sats',
      category: 'Writing',
      postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      rating: 4.5,
      poster: 'content_agency',
    },
    {
      id: '3',
      title: 'Graphic Designer',
      description: 'Design marketing materials and brand assets',
      company: 'Creative Studio',
      location: 'New York, NY',
      type: 'Hybrid',
      duration: '2 weeks',
      payRate: 500,
      currency: 'per day',
      category: 'Design',
      postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      rating: 5,
      poster: 'design_firm',
    },
  ]);

  const categories = ['all', 'Development', 'Design', 'Writing', 'Marketing', 'Support', 'Other'];
  const types = ['all', 'Remote', 'On-site', 'Hybrid'];

  // Wait for auth store to hydrate
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show sign-in prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-orange-50">
        <div className="text-center max-w-md px-6">
          <Briefcase className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-purple-900 mb-2">
            Sign in to access Gigs
          </h2>
          <p className="text-purple-600 mb-6">
            Find and post gig opportunities on Nostr
          </p>
          <a
            href="/signin"
            className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesType = selectedType === 'all' || job.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container-width section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-purple-800 flex items-center gap-3">
            <Briefcase className="w-8 h-8" />
            Gigs
          </h1>
          <p className="text-orange-600 mt-2 font-medium">
            Discover gig opportunities and freelance work
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jobs by title, company, or description..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {types.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Jobs Grid/List */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredJobs.map(job => (
              <div
                key={job.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* Job Icon Placeholder */}
                <div className={`bg-gradient-to-br from-purple-100 to-orange-100 ${
                  viewMode === 'grid' ? 'h-48' : 'w-48'
                } flex items-center justify-center`}>
                  <Briefcase className="w-16 h-16 text-purple-300" />
                </div>

                {/* Job Details */}
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-purple-900 line-clamp-1">
                      {job.title}
                    </h3>
                  </div>
                  
                  <p className="text-gray-700 font-medium text-sm mb-2">{job.company}</p>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  {/* Job Meta */}
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{job.duration}</span>
                    </div>
                    {job.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="font-medium">{job.rating}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {job.category}
                    </span>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      {job.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-5 h-5 text-purple-600" />
                        <span className="text-2xl font-bold text-purple-800">
                          {job.payRate}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">{job.currency}</span>
                    </div>
                    <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Post Job CTA */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg p-6 text-white">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">Have a gig to post?</h3>
              <p className="text-purple-100">
                Reach qualified candidates on the Nostr network
              </p>
            </div>
            <button className="px-6 py-3 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium whitespace-nowrap">
              Post a Gig
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            💼 About Gigs
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Decentralized gig board powered by Nostr</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Pay with Bitcoin, Lightning, or other modes of Payment</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Connect directly with employers via Nostr messages</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Build your reputation on the network</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
