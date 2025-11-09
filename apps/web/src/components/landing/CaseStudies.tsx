import React from 'react';
import { TrendingUp, Package, Clock, DollarSign, ArrowRight } from 'lucide-react';

export function CaseStudies() {
  const caseStudies = [
    {
      company: 'Nordic Fashion',
      industry: 'E-commerce',
      logo: 'NF',
      challenge: 'Managing 5,000+ monthly orders across 3 Nordic countries with high shipping costs and customer complaints about delivery times.',
      solution: 'Implemented Performile with Shopify integration, enabling dynamic courier selection and real-time tracking for all orders.',
      results: [
        { metric: 'Shipping Costs', value: '-35%', icon: DollarSign },
        { metric: 'Delivery Time', value: '-2 days', icon: Clock },
        { metric: 'Customer Satisfaction', value: '+28%', icon: TrendingUp },
        { metric: 'Order Volume', value: '+45%', icon: Package },
      ],
      testimonial: '"Performile transformed our logistics. We now offer same-day delivery in Oslo and next-day across Scandinavia. Customer complaints dropped by 80%."',
      author: 'Sarah Johnson, CEO',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      company: 'SwiftDelivery AB',
      industry: 'Courier Service',
      logo: 'SD',
      challenge: 'Inefficient route planning leading to high fuel costs, late deliveries, and difficulty competing with larger courier companies.',
      solution: 'Adopted Performile\'s AI-powered route optimization and real-time dispatch system for their fleet of 50 drivers.',
      results: [
        { metric: 'Fuel Costs', value: '-30%', icon: DollarSign },
        { metric: 'Deliveries/Day', value: '+40%', icon: Package },
        { metric: 'On-Time Rate', value: '98%', icon: Clock },
        { metric: 'Revenue', value: '+65%', icon: TrendingUp },
      ],
      testimonial: '"The ROI was immediate. Within 3 months, we increased capacity by 40% without adding vehicles. The route optimization alone saved us €15,000/month."',
      author: 'Lars Andersson, Operations Manager',
      color: 'from-green-500 to-emerald-600',
    },
    {
      company: 'Copenhagen Electronics',
      industry: 'Electronics Retail',
      logo: 'CE',
      challenge: 'Complex product returns process causing customer frustration and high operational costs. 15% return rate with manual processing.',
      solution: 'Integrated Performile\'s returns management system with automated label generation and tracking for all return shipments.',
      results: [
        { metric: 'Return Processing', value: '-75%', icon: Clock },
        { metric: 'Return Costs', value: '-40%', icon: DollarSign },
        { metric: 'Customer Retention', value: '+32%', icon: TrendingUp },
        { metric: 'Support Tickets', value: '-60%', icon: Package },
      ],
      testimonial: '"Returns went from our biggest headache to a competitive advantage. Customers can now initiate returns in 30 seconds from their phone."',
      author: 'Emma Nielsen, Founder',
      color: 'from-purple-500 to-pink-600',
    },
  ];

  return (
    <section id="case-studies" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Success Stories
          </h2>
          <p className="text-xl text-gray-600">
            Real results from real customers
          </p>
        </div>

        <div className="space-y-12">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              className="bg-white rounded-3xl shadow-xl overflow-hidden"
            >
              <div className="grid lg:grid-cols-2">
                {/* Left Side - Info */}
                <div className="p-8 lg:p-12">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-br ${study.color} rounded-xl flex items-center justify-center text-white text-2xl font-bold`}>
                      {study.logo}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{study.company}</h3>
                      <p className="text-gray-600">{study.industry}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">The Challenge</h4>
                      <p className="text-gray-700">{study.challenge}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">The Solution</h4>
                      <p className="text-gray-700">{study.solution}</p>
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                      <p className="text-gray-700 italic mb-2">{study.testimonial}</p>
                      <p className="text-sm text-gray-600 font-semibold">— {study.author}</p>
                    </div>
                  </div>
                </div>

                {/* Right Side - Results */}
                <div className={`bg-gradient-to-br ${study.color} p-8 lg:p-12 text-white`}>
                  <h4 className="text-2xl font-bold mb-8">The Results</h4>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {study.results.map((result, idx) => (
                      <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                        <result.icon className="h-8 w-8 mb-3" />
                        <div className="text-3xl font-bold mb-1">{result.value}</div>
                        <div className="text-sm opacity-90">{result.metric}</div>
                      </div>
                    ))}
                  </div>

                  <button className="mt-8 w-full bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                    Read Full Case Study
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
            View All Case Studies
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
