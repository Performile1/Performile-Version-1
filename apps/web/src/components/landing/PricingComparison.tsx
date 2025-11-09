import React from 'react';
import { CheckCircle, X, TrendingDown } from 'lucide-react';

export function PricingComparison() {
  // TODO: Optionally fetch from API to keep pricing in sync
  // const { data: plans } = useFetch('/api/subscription-plans?user_type=merchant&tier=2');
  // const performilePrice = plans?.monthly_price || 29;
  
  const competitors = [
    {
      name: 'Traditional Courier',
      price: '$199/mo',
      features: [
        { text: 'Single courier only', available: true },
        { text: 'Manual label printing', available: true },
        { text: 'Basic tracking', available: true },
        { text: 'Multi-courier support', available: false },
        { text: 'Real-time rates', available: false },
        { text: 'Mobile apps', available: false },
        { text: 'Analytics dashboard', available: false },
        { text: 'API access', available: false },
      ],
      savings: null,
    },
    {
      name: 'ShipStation',
      price: '$149/mo',
      features: [
        { text: 'Multi-carrier support', available: true },
        { text: 'Label printing', available: true },
        { text: 'Basic tracking', available: true },
        { text: 'Nordic couriers', available: false },
        { text: 'Real-time rates', available: true },
        { text: 'Mobile apps', available: false },
        { text: 'Advanced analytics', available: false },
        { text: 'C2C shipping', available: false },
      ],
      savings: null,
    },
    {
      name: 'Performile',
      price: '$29/mo',
      features: [
        { text: 'Multi-courier support', available: true },
        { text: 'Automated labels', available: true },
        { text: 'Real-time tracking', available: true },
        { text: 'Nordic specialists', available: true },
        { text: 'Dynamic pricing', available: true },
        { text: 'Native mobile apps', available: true },
        { text: 'Advanced analytics', available: true },
        { text: 'C2C shipping', available: true },
      ],
      savings: '$120/mo',
      highlight: true,
    },
  ];

  return (
    <section id="pricing-comparison" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-4">
            <TrendingDown className="h-5 w-5" />
            <span className="font-semibold">Save up to 85% vs competitors</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Pay More?
          </h2>
          <p className="text-xl text-gray-600">
            Compare Performile with traditional solutions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {competitors.map((competitor, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 ${
                competitor.highlight
                  ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-2xl scale-105 border-4 border-blue-400'
                  : 'bg-white border-2 border-gray-200'
              }`}
            >
              {competitor.highlight && (
                <div className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold inline-block mb-4">
                  BEST VALUE
                </div>
              )}
              
              <h3 className={`text-2xl font-bold mb-2 ${competitor.highlight ? 'text-white' : 'text-gray-900'}`}>
                {competitor.name}
              </h3>
              
              <div className="mb-6">
                <div className={`text-4xl font-bold ${competitor.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {competitor.price}
                </div>
                {competitor.savings && (
                  <div className="text-green-300 font-semibold mt-1">
                    Save {competitor.savings}
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {competitor.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {feature.available ? (
                      <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        competitor.highlight ? 'text-green-300' : 'text-green-500'
                      }`} />
                    ) : (
                      <X className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        competitor.highlight ? 'text-red-300' : 'text-red-500'
                      }`} />
                    )}
                    <span className={competitor.highlight ? 'text-blue-100' : 'text-gray-700'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  competitor.highlight
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                disabled={!competitor.highlight}
              >
                {competitor.highlight ? 'Start Free Trial' : 'Not Available'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg">
            All prices shown are for Professional plan • Enterprise pricing available
          </p>
        </div>
      </div>
    </section>
  );
}
