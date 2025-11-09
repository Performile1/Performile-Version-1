import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  Store,
  Smartphone,
  Shield,
  Zap,
  Globe,
  CreditCard,
  TrendingUp,
  Users,
  CheckCircle,
  ArrowRight,
  Download,
  ChevronDown,
  Star,
  MapPin,
  Clock,
  DollarSign,
  BarChart3,
  Plug,
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold mb-6">
              The Complete Delivery Platform
              <span className="block text-blue-200 mt-2">for the Nordic Region</span>
            </h1>
            <p className="text-xl sm:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Connect merchants, couriers, and consumers with AI-powered logistics,
              real-time tracking, and seamless payments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
              <button
                onClick={() => navigate('/demo')}
                className="inline-flex items-center px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-400 transition-colors border-2 border-white/20"
              >
                Watch Demo
              </button>
            </div>
            <p className="mt-6 text-blue-200">
              ✓ No credit card required ✓ 14-day free trial ✓ Cancel anytime
            </p>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Active Users', value: '50K+' },
              { label: 'Deliveries/Month', value: '500K+' },
              { label: 'Countries', value: '250+' },
              { label: 'Satisfaction', value: '98%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-blue-200 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From checkout widgets to mobile apps, we've built the complete ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Smartphone,
                title: 'Mobile Apps',
                description: 'Native iOS & Android apps for consumers with real-time tracking',
                color: 'bg-blue-500',
              },
              {
                icon: Plug,
                title: 'Checkout Plugins',
                description: 'WooCommerce & Shopify integrations for instant setup',
                color: 'bg-purple-500',
              },
              {
                icon: CreditCard,
                title: 'Multi-Payment Support',
                description: 'Vipps, Swish, MobilePay, Stripe - all major Nordic payments',
                color: 'bg-green-500',
              },
              {
                icon: MapPin,
                title: 'Real-Time Tracking',
                description: 'Live GPS tracking with ETA predictions and notifications',
                color: 'bg-red-500',
              },
              {
                icon: Package,
                title: 'C2C Shipping',
                description: 'Consumer-to-consumer shipping with integrated payments',
                color: 'bg-yellow-500',
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Real-time insights, performance metrics, and revenue tracking',
                color: 'bg-indigo-500',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Solutions */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for Every Industry
            </h2>
            <p className="text-xl text-gray-600">
              Why Performile is the best solution for your business
            </p>
          </div>

          <div className="space-y-12">
            {/* E-commerce */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="bg-blue-500 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">For E-commerce Merchants</h3>
                  <p className="text-gray-700 mb-4">
                    Integrate Performile in minutes with our WooCommerce and Shopify plugins.
                    Offer your customers multiple delivery options, real-time tracking, and seamless checkout.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>One-Click Integration:</strong> Install plugin, connect API, start shipping
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Dynamic Pricing:</strong> Real-time rates from multiple couriers
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Automated Labels:</strong> Print shipping labels directly from your dashboard
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Customer Notifications:</strong> Automatic SMS/email updates
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Couriers */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="bg-green-500 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">For Courier Companies</h3>
                  <p className="text-gray-700 mb-4">
                    Optimize your fleet, maximize efficiency, and grow your business with our
                    AI-powered route optimization and dynamic pricing.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Route Optimization:</strong> AI-powered routing saves 30% fuel costs
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Real-Time Dispatch:</strong> Instant job assignments to nearest driver
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Performance Analytics:</strong> Track delivery times, success rates, revenue
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Flexible Pricing:</strong> Set your own rates, surge pricing, discounts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Consumers */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8">
              <div className="flex items-start gap-6">
                <div className="bg-purple-500 w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">For Consumers</h3>
                  <p className="text-gray-700 mb-4">
                    Track your packages in real-time, ship items C2C, file claims, and manage
                    everything from our beautiful mobile apps.
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Live Tracking:</strong> See your package location on map with ETA
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>C2C Shipping:</strong> Send packages to friends/family easily
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Easy Claims:</strong> File claims with photos, track status
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Simple Returns:</strong> Request returns, schedule pickup
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Apps Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Download Our Mobile Apps
              </h2>
              <p className="text-xl text-indigo-100 mb-8">
                Track deliveries, ship packages, and manage everything on the go.
                Available for iOS and Android.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  'Real-time GPS tracking with live map',
                  'Push notifications for delivery updates',
                  'C2C shipping with integrated payments',
                  'File claims and returns with photos',
                  'Biometric login (Face ID / Fingerprint)',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-lg">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4">
                <button className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors">
                  <Download className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-xs">Download on the</div>
                    <div className="text-sm font-semibold">App Store</div>
                  </div>
                </button>
                <button className="flex items-center gap-3 bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition-colors">
                  <Download className="h-5 w-5" />
                  <div className="text-left">
                    <div className="text-xs">GET IT ON</div>
                    <div className="text-sm font-semibold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <Smartphone className="h-64 w-64 mx-auto text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plugins Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Seamless E-commerce Integration
            </h2>
            <p className="text-xl text-gray-600">
              Install our plugins and start shipping in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* WooCommerce */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-purple-500 w-16 h-16 rounded-xl flex items-center justify-center">
                  <Plug className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">WooCommerce Plugin</h3>
                  <p className="text-gray-600">For WordPress stores</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  'Automatic checkout integration',
                  'Real-time shipping rates',
                  'Label printing from WP admin',
                  'Order sync & tracking',
                  'Multi-courier support',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full bg-purple-500 text-white py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors">
                Install Plugin
              </button>
            </div>

            {/* Shopify */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-green-500 w-16 h-16 rounded-xl flex items-center justify-center">
                  <Plug className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Shopify App</h3>
                  <p className="text-gray-600">For Shopify stores</p>
                </div>
              </div>
              <ul className="space-y-3 mb-6">
                {[
                  'One-click installation',
                  'Checkout carrier calculated rates',
                  'Fulfillment automation',
                  'Tracking page integration',
                  'Returns management',
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                Install App
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about Performile
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: 'How quickly can I get started?',
                answer: 'You can start shipping in less than 10 minutes! Sign up, install our plugin (if using e-commerce), and you\'re ready to go. No complex setup or technical knowledge required.',
              },
              {
                question: 'What payment methods do you support?',
                answer: 'We support all major Nordic payment methods including Vipps (Norway), Swish (Sweden), MobilePay (Denmark), and Stripe for global coverage. More payment options coming soon!',
              },
              {
                question: 'Do you offer mobile apps?',
                answer: 'Yes! We have native iOS and Android apps for consumers with features like real-time tracking, C2C shipping, claims, and returns. Download from App Store or Google Play.',
              },
              {
                question: 'How does pricing work?',
                answer: 'We offer flexible subscription plans for merchants and couriers starting at €29/month. Consumers can use the platform for free. C2C shipping has transparent per-shipment fees.',
              },
              {
                question: 'Can I integrate with my existing e-commerce store?',
                answer: 'Absolutely! We have plugins for WooCommerce and Shopify that integrate seamlessly with your checkout. Installation takes just a few clicks.',
              },
              {
                question: 'What countries do you support?',
                answer: 'We currently focus on the Nordic region (Norway, Sweden, Denmark, Finland) with plans to expand globally. Our Stripe integration already supports 250+ countries for C2C shipping.',
              },
              {
                question: 'How do claims and returns work?',
                answer: 'Consumers can file claims or request returns directly from their dashboard or mobile app. They can upload photos, track status, and get refunds processed automatically.',
              },
              {
                question: 'Is there a free trial?',
                answer: 'Yes! We offer a 14-day free trial with full access to all features. No credit card required to start.',
              },
            ].map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-500 transition-transform ${
                      openFaq === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Knowledge Base CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Need More Help?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Visit our comprehensive knowledge base with guides, tutorials, and documentation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/knowledge-base')}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
            >
              Browse Knowledge Base
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="inline-flex items-center px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-400 transition-colors border-2 border-white/20"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Ready to Transform Your Delivery Operations?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 50,000+ users who trust Performile for their delivery needs
          </p>
          <button
            onClick={() => navigate('/register')}
            className="inline-flex items-center px-8 py-4 bg-blue-500 text-white rounded-lg font-semibold text-lg hover:bg-blue-600 transition-colors shadow-xl"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          <p className="mt-6 text-gray-400">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}
