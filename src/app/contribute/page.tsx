'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuthHydration } from '@/hooks/useAuthHydration';
import { Plus, Code, BookOpen, DollarSign, Users, Heart, Star, TrendingUp } from 'lucide-react';

interface ContributionType {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  color: string;
}

interface RecentContribution {
  id: string;
  contributor: string;
  type: string;
  description: string;
  date: Date;
  impact: number;
}

export default function ContributePage() {
  const isHydrated = useAuthHydration();
  const { isAuthenticated } = useAuthStore();

  // Contribution types
  const contributionTypes: ContributionType[] = [
    {
      id: 'code',
      title: 'Code Contributions',
      description: 'Contribute to open source projects, fix bugs, add features',
      icon: <Code className="w-8 h-8" />,
      action: 'Start Coding',
      color: 'purple',
    },
    {
      id: 'content',
      title: 'Create Content',
      description: 'Write guides, tutorials, blog posts for the community',
      icon: <BookOpen className="w-8 h-8" />,
      action: 'Write Content',
      color: 'orange',
    },
    {
      id: 'funding',
      title: 'Fund Projects',
      description: 'Support projects and initiatives with Bitcoin/Lightning',
      icon: <DollarSign className="w-8 h-8" />,
      action: 'Donate',
      color: 'purple',
    },
    {
      id: 'community',
      title: 'Build Community',
      description: 'Organize meetups, help newcomers, moderate discussions',
      icon: <Users className="w-8 h-8" />,
      action: 'Get Involved',
      color: 'orange',
    },
    {
      id: 'translation',
      title: 'Translations',
      description: 'Help translate content and tools to other languages',
      icon: <BookOpen className="w-8 h-8" />,
      action: 'Translate',
      color: 'purple',
    },
    {
      id: 'design',
      title: 'Design & UX',
      description: 'Improve interfaces, create graphics, enhance user experience',
      icon: <Star className="w-8 h-8" />,
      action: 'Design',
      color: 'orange',
    },
  ];

  // Recent contributions
  const [recentContributions] = useState<RecentContribution[]>([
    {
      id: '1',
      contributor: 'alice_dev',
      type: 'Code',
      description: 'Fixed authentication bug in sign-in flow',
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      impact: 234,
    },
    {
      id: '2',
      contributor: 'bob_writer',
      type: 'Content',
      description: 'Published guide: "Getting Started with Nostr"',
      date: new Date(Date.now() - 5 * 60 * 60 * 1000),
      impact: 567,
    },
    {
      id: '3',
      contributor: 'charlie_nomad',
      type: 'Funding',
      description: 'Donated 0.01 BTC to infrastructure fund',
      date: new Date(Date.now() - 8 * 60 * 60 * 1000),
      impact: 1000,
    },
    {
      id: '4',
      contributor: 'diana_designer',
      type: 'Design',
      description: 'Redesigned profile page UI',
      date: new Date(Date.now() - 12 * 60 * 60 * 1000),
      impact: 432,
    },
  ]);

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
          <Plus className="w-16 h-16 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-purple-900 mb-2">
            Sign in to Contribute
          </h2>
          <p className="text-purple-600 mb-6">
            Help build the future of the nomadic lifestyle on Nostr
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

  const formatTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (60 * 60 * 1000));
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
      <div className="container-width section-padding">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-purple-800 flex items-center gap-3">
            <Plus className="w-8 h-8" />
            Contribute
          </h1>
          <p className="text-orange-600 mt-2 font-medium">
            Help build and grow the nomad community on Nostr
          </p>
        </div>

        {/* Ways to Contribute */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">Ways to Contribute</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contributionTypes.map(type => (
              <div
                key={type.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  type.color === 'purple' 
                    ? 'bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600' 
                    : 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-600'
                }`}>
                  {type.icon}
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">
                  {type.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {type.description}
                </p>
                <button className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  type.color === 'purple'
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}>
                  {type.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Contributions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">Recent Contributions</h2>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="divide-y divide-gray-100">
              {recentContributions.map(contribution => (
                <div key={contribution.id} className="p-6 hover:bg-purple-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-purple-900">
                          {contribution.contributor}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                          {contribution.type}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-2">{contribution.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{formatTimeAgo(contribution.date)}</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">{contribution.impact} impact</span>
                        </div>
                      </div>
                    </div>
                    <Heart className="w-5 h-5 text-gray-400 hover:text-red-500 cursor-pointer transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contribution Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-black text-purple-600 mb-2">1,234</div>
            <div className="text-gray-600 font-medium">Total Contributors</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-black text-orange-600 mb-2">5,678</div>
            <div className="text-gray-600 font-medium">Contributions Made</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-4xl font-black text-purple-600 mb-2">0.5 BTC</div>
            <div className="text-gray-600 font-medium">Total Funding</div>
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">
            💡 Why Contribute?
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Build your reputation in the Nostr ecosystem</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Help create the tools and infrastructure you want to use</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Connect with other builders and contributors globally</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Earn recognition and potentially receive tips/donations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Shape the future of decentralized nomad communities</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
