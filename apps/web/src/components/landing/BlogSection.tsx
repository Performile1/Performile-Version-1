import React from 'react';
import { Calendar, Clock, ArrowRight, TrendingUp, Package, Zap } from 'lucide-react';

export function BlogSection() {
  const posts = [
    {
      title: '10 Ways to Reduce Shipping Costs in 2025',
      excerpt: 'Discover proven strategies to cut your delivery expenses by up to 40% while maintaining service quality.',
      category: 'Cost Optimization',
      date: 'Nov 5, 2025',
      readTime: '5 min read',
      image: 'bg-gradient-to-br from-blue-500 to-indigo-600',
      icon: TrendingUp,
    },
    {
      title: 'The Future of Last-Mile Delivery in Nordic Countries',
      excerpt: 'How AI and automation are transforming logistics across Norway, Sweden, Denmark, and Finland.',
      category: 'Industry Trends',
      date: 'Nov 3, 2025',
      readTime: '8 min read',
      image: 'bg-gradient-to-br from-purple-500 to-pink-600',
      icon: Zap,
    },
    {
      title: 'Case Study: How Nordic Fashion Scaled to 5,000 Orders/Month',
      excerpt: 'Learn how one e-commerce store used Performile to handle explosive growth without hiring more staff.',
      category: 'Success Stories',
      date: 'Oct 28, 2025',
      readTime: '6 min read',
      image: 'bg-gradient-to-br from-green-500 to-emerald-600',
      icon: Package,
    },
  ];

  const categories = [
    'All Posts',
    'Cost Optimization',
    'Industry Trends',
    'Success Stories',
    'Product Updates',
    'Best Practices',
  ];

  return (
    <section id="blog" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Latest from Our Blog
          </h2>
          <p className="text-xl text-gray-600">
            Insights, tips, and industry news to help you succeed
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                index === 0
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Posts */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {posts.map((post, index) => (
            <article
              key={index}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow group"
            >
              {/* Image */}
              <div className={`${post.image} h-48 flex items-center justify-center relative overflow-hidden`}>
                <post.icon className="h-24 w-24 text-white opacity-80 group-hover:scale-110 transition-transform" />
                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-sm font-semibold text-gray-900">
                  {post.category}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.readTime}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {post.title}
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                <button className="inline-flex items-center text-blue-600 font-semibold hover:gap-3 transition-all">
                  Read More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl font-bold mb-4">
            Never Miss an Update
          </h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter for weekly insights, industry trends, and exclusive tips
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <button className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
            View All Articles
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
