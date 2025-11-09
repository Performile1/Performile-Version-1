import React, { useState } from 'react';
import { Mail, CheckCircle, ArrowRight } from 'lucide-react';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setSubscribed(true);
      setLoading(false);
      setEmail('');
      
      // Reset after 5 seconds
      setTimeout(() => setSubscribed(false), 5000);
    }, 1000);
  };

  return (
    <section id="newsletter" className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-4">
            <Mail className="h-8 w-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Stay Updated with Performile
          </h2>
          <p className="text-xl text-blue-100">
            Get the latest features, tips, and industry insights delivered to your inbox
          </p>
        </div>

        {subscribed ? (
          <div className="bg-green-500 text-white rounded-2xl p-8 text-center">
            <CheckCircle className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">You're subscribed!</h3>
            <p className="text-green-100">
              Check your inbox for a confirmation email. Welcome to the Performile community!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="flex-1 px-6 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-blue-200 mt-4 text-center">
              Join 10,000+ subscribers • No spam • Unsubscribe anytime
            </p>
          </form>
        )}

        <div className="mt-12 grid sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold mb-2">Weekly</div>
            <div className="text-blue-200">Product updates</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">Monthly</div>
            <div className="text-blue-200">Industry insights</div>
          </div>
          <div>
            <div className="text-3xl font-bold mb-2">Exclusive</div>
            <div className="text-blue-200">Early access</div>
          </div>
        </div>
      </div>
    </section>
  );
}
