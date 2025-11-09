import React from 'react';
import { Star, Quote } from 'lucide-react';

export function Testimonials() {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO, Nordic Fashion',
      company: 'E-commerce Store',
      rating: 5,
      text: 'Performile transformed our delivery operations. We reduced shipping costs by 35% and customer satisfaction increased to 98%. The Shopify integration was seamless!',
      avatar: 'SJ',
    },
    {
      name: 'Lars Andersson',
      role: 'Operations Manager',
      company: 'SwiftDelivery AB',
      rating: 5,
      text: 'As a courier company, Performile\'s route optimization saved us 30% in fuel costs. The real-time dispatch system is a game-changer. Best investment we\'ve made.',
      avatar: 'LA',
    },
    {
      name: 'Emma Nielsen',
      role: 'Founder',
      company: 'Copenhagen Electronics',
      rating: 5,
      text: 'The WooCommerce plugin installed in 5 minutes. Our customers love the real-time tracking and multiple delivery options. Revenue increased 25% in 3 months!',
      avatar: 'EN',
    },
    {
      name: 'Michael Berg',
      role: 'Logistics Director',
      company: 'Oslo Wholesale',
      rating: 5,
      text: 'Managing 500+ daily shipments was chaos before Performile. Now everything is automated - labels, tracking, notifications. We process orders 3x faster.',
      avatar: 'MB',
    },
    {
      name: 'Sofia Karlsson',
      role: 'Consumer',
      company: 'Mobile App User',
      rating: 5,
      text: 'I use the app for all my C2C shipping. It\'s so easy - just enter address, pay with Swish, and done! Tracking is accurate and I always know when my package arrives.',
      avatar: 'SK',
    },
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-xl text-gray-600">
            See what our customers say about Performile
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-shadow relative"
            >
              <Quote className="absolute top-4 right-4 h-8 w-8 text-blue-200" />
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                  <div className="text-xs text-gray-500">{testimonial.company}</div>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-6 py-3 rounded-full border border-green-200">
            <Star className="h-5 w-5 fill-green-500 text-green-500" />
            <span className="font-semibold">4.9/5 average rating</span>
            <span className="text-green-600">• 2,500+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
}
