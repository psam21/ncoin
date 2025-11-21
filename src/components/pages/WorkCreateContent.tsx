'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Code,
  Palette,
  MessageSquare,
  TrendingUp,
  CheckCircle,
  Globe,
  DollarSign,
  LogIn,
} from 'lucide-react';
import { WorkForm } from '@/components/pages/WorkForm';
import { useAuthStore } from '@/stores/useAuthStore';

// Work opportunity categories
const workCategories = [
  {
    icon: Code,
    title: 'Development',
    description:
      'Hire developers for web, mobile, backend, or full-stack projects.',
    examples: [
      'Frontend development',
      'Backend APIs',
      'Mobile apps',
      'Web3 projects',
    ],
  },
  {
    icon: Palette,
    title: 'Design & Creative',
    description:
      'Find designers, illustrators, and creative professionals for your projects.',
    examples: ['UI/UX design', 'Branding', 'Illustrations', 'Video editing'],
  },
  {
    icon: MessageSquare,
    title: 'Content & Writing',
    description:
      'Hire writers, editors, and content creators to tell your story.',
    examples: [
      'Content writing',
      'Technical writing',
      'Copywriting',
      'Editing',
    ],
  },
  {
    icon: TrendingUp,
    title: 'Marketing & Support',
    description:
      'Get help with marketing, customer support, and business growth.',
    examples: [
      'Social media',
      'Customer support',
      'SEO',
      'Community management',
    ],
  },
];

const postingSteps = [
  {
    number: 1,
    title: 'Describe the Job',
    description: 'Provide clear details about the work opportunity and requirements.',
  },
  {
    number: 2,
    title: 'Set Compensation',
    description: 'Define the pay rate in BTC, sats, USD, or project-based pricing.',
  },
  {
    number: 3,
    title: 'Add Details',
    description: 'Specify job type (remote/on-site/hybrid), duration, and location.',
  },
  {
    number: 4,
    title: 'Publish & Connect',
    description: 'Your opportunity reaches talented digital nomads worldwide.',
  },
];

export default function WorkCreateContent() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  const handleCategorySelection = (index: number) => {
    if (!isAuthenticated) {
      // Store the intended return URL before redirecting to sign-in
      const returnUrl = '/work/create';
      router.push(`/signin?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }
    setSelectedCategory(index);
  };

  const handleWorkCreated = (workId: string) => {
    // Redirect to the work detail page after successful creation
    router.push(`/work/${workId}`);
  };

  const handleCancel = () => {
    setSelectedCategory(null);
  };

  // If user hasn't selected a category yet, show the intro/selection screen
  if (selectedCategory === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-orange-50">
        {/* Hero Section */}
        <section className="section-padding bg-white border-b border-gray-200">
          <div className="container-width">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-5xl mx-auto text-center"
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-purple-800 mb-6">
                Post a Work Opportunity
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Connect with skilled digital nomads and remote workers around the world. 
                Post your job, project, or gig on Nostr and find the perfect match.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-6 text-purple-700">
                <div
                  className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                  title="Connect with global talent"
                >
                  <Globe className="w-4 h-4 mr-2 text-orange-500" />
                  <span>Global Reach</span>
                </div>
                <div
                  className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                  title="Decentralized on Nostr"
                >
                  <Briefcase className="w-4 h-4 mr-2 text-orange-500" />
                  <span>Remote-First</span>
                </div>
                <div
                  className="flex items-center text-sm font-medium bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm"
                  title="Flexible payment options"
                >
                  <DollarSign className="w-4 h-4 mr-2 text-orange-500" />
                  <span>Flexible Pay</span>
                </div>
              </div>

              {!isAuthenticated && (
                <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <LogIn className="w-6 h-6 text-purple-600" />
                    <p className="text-purple-900 font-medium">
                      Sign in to post work opportunities
                    </p>
                  </div>
                  <button
                    onClick={() => router.push(`/signin?returnUrl=${encodeURIComponent('/work/create')}`)}
                    className="btn-primary"
                  >
                    Sign In with Nostr
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Work Categories */}
        <section className="section-padding">
          <div className="container-width">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-blue-800 mb-4">
                What type of work are you offering?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose the category that best matches your opportunity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {workCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    onClick={() => handleCategorySelection(index)}
                    className="card p-6 cursor-pointer hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 to-orange-100 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-purple-800 mb-2">
                      {category.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <ul className="space-y-2">
                      {category.examples.map((example, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-500 flex items-center"
                        >
                          <CheckCircle className="w-4 h-4 text-orange-500 mr-2 flex-shrink-0" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="section-padding bg-white">
          <div className="container-width">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-purple-800 mb-4">
                How posting works
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Simple steps to connect with talented professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {postingSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-orange-600 text-white text-2xl font-bold rounded-full mx-auto mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-semibold text-purple-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        {isAuthenticated && (
          <section className="section-padding bg-gradient-to-r from-purple-600 to-orange-600 text-white">
            <div className="container-width">
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">
                  Ready to find your next team member?
                </h2>
                <p className="text-lg mb-8 text-purple-50">
                  Choose a category above to get started with your job posting
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    );
  }

  // User has selected a category - show the form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <section className="section-padding">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-4xl mx-auto mb-8 text-center">
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-purple-800 mb-4">
                Post Your Opportunity
              </h1>
              <p className="text-gray-600">
                Fill out the details below to publish your work opportunity to the Nostr network
              </p>
            </div>

            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
              <WorkForm
                onWorkCreated={handleWorkCreated}
                onCancel={handleCancel}
              />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
