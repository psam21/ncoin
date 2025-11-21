'use client';

import Link from 'next/link';
import { Briefcase, MessageCircle, Users, Wallet, ShoppingBag, Plane, Shield, Zap, Globe, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-orange-600/10"></div>
        <div className="container-width pt-16 lg:pt-20 pb-16 md:pb-20 relative">
          <div className="max-w-4xl mx-auto text-center py-20">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-orange-600 mb-6 leading-tight">
              Your Global Hub for the Nomadic Lifestyle
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
              Connect, work, travel, and trade on the Nostr network. Own your identity, control your data, embrace freedom.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/signin"
                className="px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl font-bold text-lg border-2 border-purple-600"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container-width section-padding py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Everything You Need in One Place
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built on Nostr protocol for true decentralization and freedom
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Work */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6">
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Work</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Find freelance work or hire talent. Post jobs, browse opportunities, and get paid in Bitcoin.
            </p>
            <Link
              href="/work"
              className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-2"
            >
              Explore Work <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Messages */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6">
              <MessageCircle className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Messages</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Encrypted, decentralized messaging. Chat securely with anyone on the Nostr network.
            </p>
            <Link
              href="/messages"
              className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-2"
            >
              Start Messaging <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Meetups */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Meetups</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Connect with nomads in person. Join or organize meetups, workshops, and events worldwide.
            </p>
            <Link
              href="/meetups"
              className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-2"
            >
              Find Meetups <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6">
              <Wallet className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Payments</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Send and receive Bitcoin payments. Lightning-fast, low-fee transactions globally.
            </p>
            <Link
              href="/payments"
              className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-2"
            >
              Manage Payments <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Shop */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-6">
              <ShoppingBag className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Shop</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Decentralized marketplace. Buy and sell products, services, and digital goods.
            </p>
            <Link
              href="/shop"
              className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-2"
            >
              Browse Shop <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Travel */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mb-6">
              <Plane className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Travel</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Book accommodations, experiences, and transport. Travel the world with the Nostr community.
            </p>
            <Link
              href="/travel"
              className="text-orange-600 font-semibold hover:text-orange-700 flex items-center gap-2"
            >
              Plan Travel <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Nostr Section */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-20">
        <div className="container-width section-padding">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Why Nostr for Nomads?
            </h2>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Built on principles of freedom, privacy, and true ownership
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Own Your Identity</h3>
              <p className="text-purple-100 leading-relaxed">
                Your keys, your data. No central authority controls your account or content.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Lightning Fast</h3>
              <p className="text-purple-100 leading-relaxed">
                Built on Bitcoin Lightning Network for instant, low-cost global payments.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Truly Global</h3>
              <p className="text-purple-100 leading-relaxed">
                Censorship-resistant network that works anywhere, connecting nomads worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-width section-padding py-20">
        <div className="bg-gradient-to-br from-purple-50 to-orange-50 rounded-3xl p-12 md:p-16 text-center border-2 border-purple-200">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Ready to Join the Movement?
          </h2>
          <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            Create your account in minutes and start connecting with the global nomad community on Nostr.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="px-10 py-5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center gap-2"
            >
              Create Account
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/signin"
              className="px-10 py-5 bg-white text-purple-600 rounded-xl hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl font-bold text-lg border-2 border-purple-600"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
