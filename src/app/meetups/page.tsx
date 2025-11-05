'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Users, Search, Filter, MapPin, Calendar, Clock, User, Plus } from 'lucide-react';

interface Meetup {
  id: string;
  title: string;
  description: string;
  organizer: string;
  location: string;
  city: string;
  country: string;
  date: Date;
  time: string;
  attendees: number;
  maxAttendees?: number;
  type: 'casual' | 'professional' | 'workshop' | 'conference';
  tags: string[];
}

export default function MeetupsPage() {
  const isHydrated = useAuthHydration();
  const { isAuthenticated } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  // Sample meetups - in real app this would come from Nostr
  const [meetups] = useState<Meetup[]>([
    {
      id: '1',
      title: 'Bitcoin & Coffee Meetup',
      description: 'Casual gathering for Bitcoin enthusiasts. Bring your questions and let\'s chat about the future of money!',
      organizer: 'satoshi_lisbon',
      location: 'Café Bitcoin, Baixa',
      city: 'Lisbon',
      country: 'Portugal',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      time: '10:00 AM',
      attendees: 12,
      maxAttendees: 20,
      type: 'casual',
      tags: ['Bitcoin', 'Networking', 'Coffee'],
    },
    {
      id: '2',
      title: 'Digital Nomad Coworking Day',
      description: 'Join fellow remote workers for a day of focused work and networking in Canggu.',
      organizer: 'bali_nomads',
      location: 'Dojo Bali',
      city: 'Bali',
      country: 'Indonesia',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      time: '9:00 AM',
      attendees: 28,
      maxAttendees: 40,
      type: 'professional',
      tags: ['Coworking', 'Networking', 'Remote Work'],
    },
    {
      id: '3',
      title: 'Nostr Protocol Workshop',
      description: 'Deep dive into Nostr protocol. Learn how to build decentralized applications.',
      organizer: 'nostr_dev_mx',
      location: 'WeWork Polanco',
      city: 'Mexico City',
      country: 'Mexico',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      time: '2:00 PM',
      attendees: 15,
      maxAttendees: 25,
      type: 'workshop',
      tags: ['Nostr', 'Development', 'Workshop'],
    },
    {
      id: '4',
      title: 'Nomad Conference 2025',
      description: '3-day conference for digital nomads, remote workers, and location-independent entrepreneurs.',
      organizer: 'nomad_summit',
      location: 'Chiang Mai Convention Center',
      city: 'Chiang Mai',
      country: 'Thailand',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      time: '9:00 AM',
      attendees: 234,
      maxAttendees: 500,
      type: 'conference',
      tags: ['Conference', 'Networking', 'Business'],
    },
  ]);

  const types = ['all', 'Casual', 'Professional', 'Workshop', 'Conference'];
  const locations = ['all', ...Array.from(new Set(meetups.map(m => m.country)))];

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
          <Users className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-purple-900 mb-2">
            Sign in to Join Meetups
          </h2>
          <p className="text-purple-600 mb-6">
            Connect with nomads in person at meetups around the world
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

  const filteredMeetups = meetups.filter(meetup => {
    const matchesSearch = meetup.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         meetup.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         meetup.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         meetup.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || meetup.type === selectedType.toLowerCase();
    const matchesLocation = selectedLocation === 'all' || meetup.country === selectedLocation;
    return matchesSearch && matchesType && matchesLocation;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'casual': return 'bg-blue-100 text-blue-700';
      case 'professional': return 'bg-purple-100 text-purple-700';
      case 'workshop': return 'bg-orange-100 text-orange-700';
      case 'conference': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container-width section-padding">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-purple-800 flex items-center gap-3">
              <Users className="w-8 h-8" />
              Meetups
            </h1>
            <p className="text-orange-600 mt-2 font-medium">
              Connect with nomads in person around the world
            </p>
          </div>
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Meetup
          </button>
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
                placeholder="Search meetups by title, location, or tags..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
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

            {/* Location Filter */}
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>
                    {loc === 'all' ? 'All Locations' : loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Meetups List */}
        {filteredMeetups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No meetups found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredMeetups.map(meetup => (
              <div
                key={meetup.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Date Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-orange-100 rounded-xl flex flex-col items-center justify-center">
                      <div className="text-sm font-medium text-purple-600">
                        {meetup.date.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="text-2xl font-bold text-purple-900">
                        {meetup.date.getDate()}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-purple-900 mb-2">
                          {meetup.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{meetup.description}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap ml-4 ${getTypeColor(meetup.type)}`}>
                        {meetup.type.charAt(0).toUpperCase() + meetup.type.slice(1)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-purple-600" />
                        <span>{meetup.city}, {meetup.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        <span>{meetup.date.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span>{meetup.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-purple-600" />
                        <span>
                          {meetup.attendees}
                          {meetup.maxAttendees && `/${meetup.maxAttendees}`} attending
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {meetup.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-600">
                        Organized by <span className="font-medium text-purple-600">{meetup.organizer}</span>
                      </div>
                      <button className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium">
                        Join Meetup
                      </button>
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
            🤝 About Meetups
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Connect with fellow nomads in person at locations worldwide</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Join casual coffee chats, professional networking, or educational workshops</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Organize your own meetups and build local communities</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>All meetups are coordinated via Nostr for decentralized organization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>RSVP and communicate directly with organizers through messaging</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
