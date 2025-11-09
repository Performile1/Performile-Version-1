import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Book,
  Package,
  Truck,
  Store,
  Smartphone,
  CreditCard,
  Settings,
  HelpCircle,
  FileText,
  Video,
  Code,
  ArrowRight,
} from 'lucide-react';

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      icon: Package,
      title: 'Getting Started',
      description: 'Learn the basics and set up your account',
      articles: 12,
      color: 'bg-blue-500',
    },
    {
      icon: Store,
      title: 'For Merchants',
      description: 'E-commerce integration and shipping guides',
      articles: 18,
      color: 'bg-purple-500',
    },
    {
      icon: Truck,
      title: 'For Couriers',
      description: 'Fleet management and delivery optimization',
      articles: 15,
      color: 'bg-green-500',
    },
    {
      icon: Smartphone,
      title: 'Mobile Apps',
      description: 'iOS and Android app guides',
      articles: 10,
      color: 'bg-indigo-500',
    },
    {
      icon: CreditCard,
      title: 'Payments',
      description: 'Payment methods and billing',
      articles: 8,
      color: 'bg-yellow-500',
    },
    {
      icon: Settings,
      title: 'API & Integrations',
      description: 'Developer documentation and plugins',
      articles: 20,
      color: 'bg-red-500',
    },
  ];

  const popularArticles = [
    {
      title: 'How to install the WooCommerce plugin',
      category: 'For Merchants',
      readTime: '5 min',
    },
    {
      title: 'Setting up Vipps payments in Norway',
      category: 'Payments',
      readTime: '3 min',
    },
    {
      title: 'Real-time tracking: A complete guide',
      category: 'Getting Started',
      readTime: '7 min',
    },
    {
      title: 'Optimizing delivery routes for maximum efficiency',
      category: 'For Couriers',
      readTime: '10 min',
    },
    {
      title: 'Using the mobile app for C2C shipping',
      category: 'Mobile Apps',
      readTime: '4 min',
    },
    {
      title: 'API authentication and security',
      category: 'API & Integrations',
      readTime: '8 min',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Knowledge Base</h1>
            <p className="text-xl text-blue-100">
              Find answers, guides, and tutorials
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for articles, guides, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Browse by Category</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <button
              key={category.title}
              onClick={() => navigate(`/knowledge-base/${category.title.toLowerCase().replace(/ /g, '-')}`)}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow text-left group"
            >
              <div className={`${category.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <category.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.title}</h3>
              <p className="text-gray-600 mb-3">{category.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{category.articles} articles</span>
                <ArrowRight className="h-5 w-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Popular Articles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Popular Articles</h2>
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {popularArticles.map((article, index) => (
            <button
              key={index}
              onClick={() => navigate(`/knowledge-base/article/${index}`)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-left group"
            >
              <div className="flex items-center gap-4 flex-1">
                <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-500">{article.category}</span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{article.readTime} read</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Additional Resources</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
              <Video className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Tutorials</h3>
              <p className="text-gray-600 mb-4">
                Watch step-by-step video guides for common tasks
              </p>
              <button className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-2">
                Watch Videos
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
              <Code className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">API Documentation</h3>
              <p className="text-gray-600 mb-4">
                Complete API reference for developers
              </p>
              <button className="text-purple-600 font-semibold hover:text-purple-700 flex items-center gap-2">
                View API Docs
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl">
              <HelpCircle className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contact Support</h3>
              <p className="text-gray-600 mb-4">
                Can't find what you're looking for? We're here to help
              </p>
              <button className="text-green-600 font-semibold hover:text-green-700 flex items-center gap-2">
                Get Support
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
