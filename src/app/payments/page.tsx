'use client';

import { useState } from 'react';
import { Bitcoin, Zap, DollarSign, Coins } from 'lucide-react';

type PaymentMethod = 'bitcoin' | 'lightning' | 'usdt' | 'others';

export default function PaymentsPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const paymentMethods = [
    {
      id: 'bitcoin' as PaymentMethod,
      name: 'Bitcoin',
      description: 'On-chain Bitcoin payments',
      icon: Bitcoin,
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'lightning' as PaymentMethod,
      name: 'Lightning Network',
      description: 'Instant Bitcoin payments',
      icon: Zap,
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      id: 'usdt' as PaymentMethod,
      name: 'USDT',
      description: 'Tether stablecoin',
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'others' as PaymentMethod,
      name: 'Others',
      description: 'Additional payment options',
      icon: Coins,
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-orange-50 pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent mb-4">
            Payments
          </h1>
          <p className="text-gray-600 text-lg">
            Choose your preferred payment method
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            
            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`relative p-6 rounded-2xl transition-all duration-300 ${
                  isSelected
                    ? 'ring-4 ring-purple-500 shadow-2xl scale-105'
                    : 'hover:shadow-xl hover:scale-102 bg-white'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${method.color} opacity-5 rounded-2xl`}></div>
                <div className="relative">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${method.color} flex items-center justify-center mb-4 mx-auto`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {method.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {method.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedMethod && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-purple-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {paymentMethods.find(m => m.id === selectedMethod)?.name} Payment
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                    {selectedMethod === 'usdt' ? 'USDT' : 'BTC'}
                  </div>
                </div>
              </div>

              {selectedMethod === 'lightning' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lightning Invoice
                  </label>
                  <textarea
                    placeholder="lnbc..."
                    rows={3}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                  />
                </div>
              )}

              {(selectedMethod === 'bitcoin' || selectedMethod === 'usdt') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    placeholder={selectedMethod === 'bitcoin' ? 'bc1...' : '0x...'}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all">
                  Send Payment
                </button>
                <button
                  onClick={() => setSelectedMethod(null)}
                  className="px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {!selectedMethod && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-12 h-12 text-purple-600" />
            </div>
            <p className="text-gray-500 text-lg">
              Select a payment method to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
