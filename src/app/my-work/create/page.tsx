'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { WorkForm } from '@/components/pages/WorkForm';
import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const workTypes = [
  {
    icon: '💻',
    title: 'Development',
    description: 'Software development, coding, and technical projects.',
    examples: ['Web dev', 'Mobile apps', 'Backend', 'Frontend'],
  },
  {
    icon: '🎨',
    title: 'Design',
    description: 'Creative design work and visual content creation.',
    examples: ['UI/UX', 'Graphics', 'Branding', 'Illustration'],
  },
  {
    icon: '✍️',
    title: 'Writing & Content',
    description: 'Content creation, copywriting, and documentation.',
    examples: ['Blog posts', 'Copy', 'Technical docs', 'Marketing'],
  },
  {
    icon: '📢',
    title: 'Marketing & Support',
    description: 'Marketing, community management, and customer support.',
    examples: ['Social media', 'SEO', 'Community', 'Support'],
  },
];

const postingSteps = [
  {
    number: 1,
    title: 'Choose Your Type',
    description: 'Select the type of work opportunity you want to post.',
  },
  {
    number: 2,
    title: 'Add Details',
    description: 'Describe requirements, responsibilities, and compensation.',
  },
  {
    number: 3,
    title: 'Add Media',
    description: 'Include relevant materials or visuals for the role.',
  },
  {
    number: 4,
    title: 'Post & Hire',
    description: 'Your opportunity reaches skilled nomads looking for work.',
  },
];

export default function WorkCreatePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [selectedType, setSelectedType] = useState<number | null>(null);

  // Add detailed logging for debugging
  useEffect(() => {
    console.log('[MY-WORK/CREATE] Component mounted/updated:', {
      _hasHydrated,
      hasUser: !!user,
      userPubkey: user?.pubkey?.substring(0, 16) || 'none',
      timestamp: new Date().toISOString(),
    });
  }, [_hasHydrated, user]);

  useEffect(() => {
    // Only check auth after hydration is complete
    if (_hasHydrated && !user) {
      console.log('[MY-WORK/CREATE] Redirecting to signin - no user after hydration');
      router.push('/signin?returnUrl=' + encodeURIComponent('/my-work/create'));
    } else if (_hasHydrated && user) {
      console.log('[MY-WORK/CREATE] User authenticated after hydration:', {
        pubkey: user.pubkey.substring(0, 16),
        npub: user.npub.substring(0, 16),
      });
    }
  }, [_hasHydrated, user, router]);

  const handleWorkCreated = (workId: string) => {
    console.log('Work created:', workId);
    // Redirect handled by WorkForm
  };

  const handleCancel = () => {
    router.push('/my-work');
  };

  // Show loading state while hydrating
  if (!_hasHydrated) {
    console.log('[MY-WORK/CREATE] Waiting for hydration...');
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // After hydration, if no user, return null (redirect will happen via useEffect)
  if (!user) {
    console.log('[MY-WORK/CREATE] No user after hydration, returning null (redirect pending)');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Intro Section */}
      <section className="pt-0 pb-16 md:pb-20 bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-purple-800 mb-4">
              What Work Do You Offer?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Select the type of work you want to post. Your skills help the nomad
              community thrive.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {workTypes.map((type, index) => {
              const active = selectedType === index;
              return (
                <motion.button
                  key={type.title}
                  type="button"
                  onClick={() => setSelectedType(index)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`p-6 rounded-xl border transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    active
                      ? 'bg-purple-800 text-white border-purple-700 shadow-lg'
                      : 'bg-white hover:shadow-md border-gray-200'
                  }`}
                  aria-pressed={active}
                >
                  <div className={`text-4xl mb-4 ${active ? 'grayscale-0' : ''}`}>{type.icon}</div>
                  <h3 className="font-serif font-bold text-lg mb-2">{type.title}</h3>
                  <p className={`text-sm mb-3 leading-relaxed ${
                    active ? 'text-orange-100' : 'text-gray-600'
                  }`}>
                    {type.description}
                  </p>
                  <ul className={`text-xs space-y-1 ${active ? 'text-orange-200' : 'text-gray-500'}`}>
                    {type.examples.map((example) => (
                      <li key={example} className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        {example}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Work Form - Only show when type is selected */}
      {selectedType !== null && (
        <section className="section-padding bg-gray-50">
          <div className="container-width">
            <WorkForm
              onWorkCreated={handleWorkCreated}
              onCancel={handleCancel}
              isEditMode={false}
            />
          </div>
        </section>
      )}

      {/* Process Steps */}
      <section className="section-padding bg-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-purple-800 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our simple process makes it easy to post work opportunities and find talent in the nomad community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {postingSteps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">{step.number}</span>
                </div>
                <h3 className="text-lg font-serif font-bold text-purple-800 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
