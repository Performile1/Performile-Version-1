import React, { useState } from 'react';
import { MapPin, Search, CheckCircle, X } from 'lucide-react';

export function CoverageMap() {
  const [postalCode, setPostalCode] = useState('');
  const [searchResult, setSearchResult] = useState<{
    covered: boolean;
    city?: string;
    couriers?: string[];
    deliveryTime?: string;
  } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate coverage check
    const covered = postalCode.length >= 4;
    setSearchResult({
      covered,
      city: covered ? 'Oslo' : undefined,
      couriers: covered ? ['PostNord', 'Bring', 'Porterbuddy', 'Budbee'] : undefined,
      deliveryTime: covered ? '1-2 days' : undefined,
    });
  };

  const regions = [
    { name: 'Norway', coverage: 98, cities: 'Oslo, Bergen, Trondheim, Stavanger', couriers: 8 },
    { name: 'Sweden', coverage: 97, cities: 'Stockholm, Gothenburg, Malmö, Uppsala', couriers: 9 },
    { name: 'Denmark', coverage: 99, cities: 'Copenhagen, Aarhus, Odense, Aalborg', couriers: 7 },
    { name: 'Finland', coverage: 95, cities: 'Helsinki, Espoo, Tampere, Vantaa', couriers: 6 },
  ];

  return (
    <section id="coverage-map" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Nordic Coverage
          </h2>
          <p className="text-xl text-gray-600">
            Check if we deliver to your area
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Coverage Checker */}
          <div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Check Your Postal Code</h3>
              
              <form onSubmit={handleSearch} className="mb-6">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="Enter postal code (e.g., 0150)"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Search className="h-5 w-5" />
                    Check
                  </button>
                </div>
              </form>

              {searchResult && (
                <div className={`rounded-xl p-6 ${
                  searchResult.covered 
                    ? 'bg-green-100 border-2 border-green-500' 
                    : 'bg-red-100 border-2 border-red-500'
                }`}>
                  <div className="flex items-start gap-3">
                    {searchResult.covered ? (
                      <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    ) : (
                      <X className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      <h4 className={`font-bold text-lg mb-2 ${
                        searchResult.covered ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {searchResult.covered ? 'Great news! We deliver to your area' : 'Not covered yet'}
                      </h4>
                      {searchResult.covered ? (
                        <div className="space-y-2 text-green-800">
                          <p><strong>City:</strong> {searchResult.city}</p>
                          <p><strong>Available Couriers:</strong> {searchResult.couriers?.join(', ')}</p>
                          <p><strong>Typical Delivery:</strong> {searchResult.deliveryTime}</p>
                        </div>
                      ) : (
                        <p className="text-red-800">
                          We're expanding rapidly! Enter your email to be notified when we reach your area.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Regional Coverage */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Coverage by Country</h3>
              {regions.map((region, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-lg font-semibold text-gray-900">{region.name}</h4>
                    <div className="text-2xl font-bold text-blue-600">{region.coverage}%</div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all"
                      style={{ width: `${region.coverage}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Major Cities:</strong> {region.cities}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Partner Couriers:</strong> {region.couriers}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Map Visualization */}
          <div>
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 h-full min-h-[600px] flex items-center justify-center relative overflow-hidden">
              {/* Simplified Nordic Map */}
              <div className="relative w-full h-full">
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="h-64 w-64 text-blue-600 opacity-20" />
                </div>
                
                {/* Coverage Points */}
                <div className="absolute top-1/4 left-1/3 animate-pulse">
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg" />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md text-xs font-semibold whitespace-nowrap">
                    Oslo
                  </div>
                </div>
                
                <div className="absolute top-1/3 right-1/4 animate-pulse" style={{ animationDelay: '0.2s' }}>
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg" />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md text-xs font-semibold whitespace-nowrap">
                    Stockholm
                  </div>
                </div>
                
                <div className="absolute bottom-1/3 left-1/4 animate-pulse" style={{ animationDelay: '0.4s' }}>
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg" />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md text-xs font-semibold whitespace-nowrap">
                    Copenhagen
                  </div>
                </div>
                
                <div className="absolute top-1/2 right-1/3 animate-pulse" style={{ animationDelay: '0.6s' }}>
                  <div className="w-4 h-4 bg-blue-500 rounded-full shadow-lg" />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-lg shadow-md text-xs font-semibold whitespace-nowrap">
                    Helsinki
                  </div>
                </div>

                {/* Stats Overlay */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-xl">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">97%</div>
                      <div className="text-sm text-gray-600">Coverage</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-600">30+</div>
                      <div className="text-sm text-gray-600">Couriers</div>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-blue-600">500K+</div>
                      <div className="text-sm text-gray-600">Deliveries/mo</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Don't see your area? We're expanding rapidly across Europe!
          </p>
          <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Request Coverage in Your Area
          </button>
        </div>
      </div>
    </section>
  );
}
