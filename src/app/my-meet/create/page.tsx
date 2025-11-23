'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { MeetupForm } from '@/components/pages/MeetupForm';
import { CheckCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const meetupTypes = [
  {
    icon: '👥',
    title: 'Social Gathering',
    description: 'Connect with fellow nomads in a casual, relaxed environment.',
    examples: ['Coffee meetups', 'Dinner parties', 'Game nights', 'Beach gatherings'],
  },
  {
    icon: '🛠️',
    title: 'Workshop',
    description: 'Host hands-on learning sessions and skill-sharing events.',
    examples: ['Coding workshops', 'Design sprints', 'Language exchange', 'Craft sessions'],
  },
  {
    icon: '🎤',
    title: 'Conference',
    description: 'Organize larger events with speakers and structured content.',
    examples: ['Tech talks', 'Panel discussions', 'Summits', 'Unconferences'],
  },
  {
    icon: '🤝',
    title: 'Networking',
    description: 'Build professional connections and collaborate on projects.',
    examples: ['Coworking days', 'Mastermind groups', 'Pitch nights', 'Skill shares'],
  },
];

const organizingSteps = [
  {
    number: 1,
    title: 'Choose Your Type',
    description: 'Select the type of meetup you want to host.',
  },
  {
    number: 2,
    title: 'Add Details',
    description: 'Set date, time, location, and describe your event.',
  },
  {
    number: 3,
    title: 'Add Media',
    description: 'Upload an event image to make it stand out.',
  },
  {
    number: 4,
    title: 'Publish & Host',
    description: 'Your event goes live for the community to RSVP.',
  },
];

export default function CreateMeetupPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const [selectedType, setSelectedType] = useState<number | null>(null);

  useEffect(() => {
    console.log('[MY-MEET/CREATE] Component state:', {
      _hasHydrated,
      hasUser: !!user,
      userPubkey: user?.pubkey?.substring(0, 16) || 'none',
      timestamp: new Date().toISOString(),
    });
  }, [_hasHydrated, user]);

  useEffect(() => {
    if (_hasHydrated && !user) {
      console.log('[MY-MEET/CREATE] Redirecting to signin - no user after hydration');
      router.push('/signin?returnUrl=' + encodeURIComponent('/my-meet/create'));
    } else if (_hasHydrated && user) {
      console.log('[MY-MEET/CREATE] User authenticated:', {
        pubkey: user.pubkey.substring(0, 16),
      });
    }
  }, [_hasHydrated, user, router]);

  const handleTypeSelection = (index: number) => {
    setSelectedType(index);
  };

  const handleMeetupCreated = (meetupId: string) => {
    console.log('Meetup created:', meetupId);
    router.push('/my-meet');
  };

  const handleCancel = () => {
    router.push('/my-meet');
  };

  if (!_hasHydrated) {
    console.log('[MY-MEET/CREATE] Waiting for hydration...');
    return (
      <div className="min-h-screen bg-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('[MY-MEET/CREATE] No user after hydration, returning null (redirect pending)');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="pt-16 lg:pt-20 pb-16 md:pb-20 bg-gradient-to-r from-purple-600 to-orange-600 text-white">
        <div className="container-width">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              What Type of Meetup?
            </h2>
            <p className="text-lg text-purple-50 max-w-2xl mx-auto">
              Select the type of event you want to host. Bring the nomad community together in person.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {meetupTypes.map((type, index) => {
              const active = selectedType === index;
              return (
                <motion.button
                  key={index}
                  type="button"
                  onClick={() => handleTypeSelection(index)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`p-6 rounded-xl border transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-white ${
                    active
                      ? 'bg-white text-purple-900 border-white shadow-xl scale-105'
                      : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/20'
                  }`}
                  aria-pressed={active}
                >
                  <div className={`text-4xl mb-4 ${active ? 'grayscale-0' : ''}`}>{type.icon}</div>
                  <h3 className="font-serif font-bold text-lg mb-2">{type.title}</h3>
                  <p className={`text-sm mb-3 leading-relaxed ${active ? 'text-gray-600' : 'text-purple-100'}`}>
                    {type.description}
                  </p>
                  <ul className={`text-xs space-y-1 ${active ? 'text-gray-500' : 'text-purple-200'}`}>
                    {type.examples.map((ex) => (
                      <li key={ex} className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-2" /> {ex}
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Meetup Form - Only show when type is selected */}
      {selectedType !== null && (
        <section className="section-padding bg-gray-50">
          <div className="container-width">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <MeetupForm
                onMeetupCreated={handleMeetupCreated}
                onCancel={handleCancel}
                isEditMode={false}
              />
            </motion.div>
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
              Our simple process makes it easy to organize and host meetups with the nomad community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {organizingSteps.map((step, index) => (
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
