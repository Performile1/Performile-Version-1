import React from 'react';
import { Play } from 'lucide-react';

export function DemoVideo() {
  return (
    <section id="demo-video" className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            See Performile in Action
          </h2>
          <p className="text-xl text-purple-100">
            Watch our 2-minute product tour
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl" style={{ paddingBottom: '56.25%' }}>
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900 to-indigo-900">
              <button 
                onClick={() => {
                  // Replace with actual video URL when available
                  window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
                }}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl"
              >
                <Play className="h-10 w-10 text-purple-600 ml-1" />
              </button>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <p className="text-sm opacity-75">Product Demo • 2:34</p>
              </div>
            </div>
          </div>
          <p className="text-center mt-4 text-purple-100">
            See how Performile streamlines your delivery operations
          </p>
        </div>
      </div>
    </section>
  );
}
