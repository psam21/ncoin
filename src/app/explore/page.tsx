'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Compass, Search, TrendingUp, Users, MapPin, Calendar, Heart, MessageCircle } from 'lucide-react';

interface ExploreItem {
  id: string;
  type: 'event' | 'location' | 'community' | 'story';
  title: string;
  description: string;
  author: string;
  location?: string;
  date?: Date;
  likes?: number;
  comments?: number;
  image?: string;
  tags: string[];
}

export default function ExplorePage() {
  const isHydrated = useAuthHydration();
  const { isAuthenticated } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sample explore items - in real app this would come from Nostr
  const [items] = useState<ExploreItem[]>([
    {
      id: '1',
      type: 'location',
      title: 'Best Digital Nomad Hubs in Bali',
      description: 'Discover coworking spaces, cafes, and communities in Bali perfect for remote work',
      author: 'nomad_explorer',
      location: 'Bali, Indonesia',
      likes: 156,
      comments: 42,
      tags: ['Bali', 'Coworking', 'Asia'],
    },
    {
      id: '2',
      type: 'event',
      title: 'Bitcoin Meetup Lisbon',
      description: 'Join us for drinks and Bitcoin discussions in Lisbon',
      author: 'btc_portugal',
      location: 'Lisbon, Portugal',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      likes: 89,
      comments: 23,
      tags: ['Bitcoin', 'Meetup', 'Portugal'],
    },
    {
      id: '3',
      type: 'community',
      title: 'Remote Workers in Mexico City',
      description: 'A thriving community of 500+ digital nomads in CDMX',
      author: 'cdmx_nomads',
      location: 'Mexico City, Mexico',
      likes: 234,
      comments: 67,
      tags: ['Community', 'Mexico', 'Remote Work'],
    },
    {
      id: '4',
      type: 'story',
      title: 'How I Built My Business While Traveling',
      description: 'From zero to six figures while living in 15 countries',
      author: 'startup_nomad',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      likes: 421,
      comments: 98,
      tags: ['Entrepreneurship', 'Travel', 'Success'],
    },
  ]);

  const categories = ['all', 'Locations', 'Events', 'Communities', 'Stories'];

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
          <Compass className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-purple-900 mb-2">
            Sign in to Explore
          </h2>
          <p className="text-purple-600 mb-6">
            Discover nomad communities, events, and stories from around the world
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

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory.toLowerCase().slice(0, -1) === item.type || 
                            selectedCategory.toLowerCase() === item.type);
    return matchesSearch && matchesCategory;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'location': return <MapPin className="w-5 h-5 text-purple-600" />;
      case 'event': return <Calendar className="w-5 h-5 text-orange-600" />;
      case 'community': return <Users className="w-5 h-5 text-purple-600" />;
      case 'story': return <TrendingUp className="w-5 h-5 text-orange-600" />;
      default: return <Compass className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container-width section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-purple-800 flex items-center gap-3">
            <Compass className="w-8 h-8" />
            Explore
          </h1>
          <p className="text-orange-600 mt-2 font-medium">
            Discover communities, events, and nomad stories from around the world
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
                placeholder="Search locations, events, communities..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
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
        </div>

        {/* Explore Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Compass className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              >
                {/* Image Placeholder */}
                <div className="h-48 bg-gradient-to-br from-purple-100 to-orange-100 flex items-center justify-center">
                  {getIcon(item.type)}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                      item.type === 'event' ? 'bg-orange-100 text-orange-700' :
                      item.type === 'location' ? 'bg-purple-100 text-purple-700' :
                      item.type === 'community' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-purple-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {item.description}
                  </p>

                  {item.location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{item.location}</span>
                    </div>
                  )}

                  {item.date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{item.date.toLocaleDateString()}</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-sm text-gray-500">by {item.author}</span>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {item.likes !== undefined && (
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{item.likes}</span>
                        </div>
                      )}
                      {item.comments !== undefined && (
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{item.comments}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            🧭 About Explore
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Discover nomad-friendly locations and hidden gems worldwide</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Find and join local meetups, events, and gatherings</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Connect with thriving nomad communities globally</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Read inspiring stories from fellow digital nomads</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Share your own experiences and help others on their journey</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
