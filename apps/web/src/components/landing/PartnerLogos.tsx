import React from 'react';

export function PartnerLogos() {
  const partners = [
    'Bring', 'PostNord', 'DHL', 'Budbee', 
    'Porterbuddy', 'Helthjem', 'Instabox', 'Best Transport'
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-gray-600 mb-8 font-semibold">
          Trusted by leading Nordic courier companies
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center opacity-60">
          {partners.map((partner) => (
            <div key={partner} className="text-2xl font-bold text-gray-400">
              {partner}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
