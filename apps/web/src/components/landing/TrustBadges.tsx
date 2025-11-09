import React from 'react';
import { Shield, Lock, Award, CheckCircle } from 'lucide-react';

export function TrustBadges() {
  return (
    <section className="py-8 bg-gray-50 border-y border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-2 text-gray-700">
            <Shield className="h-6 w-6 text-green-600" />
            <span className="font-semibold">SSL Encrypted</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Lock className="h-6 w-6 text-green-600" />
            <span className="font-semibold">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <Award className="h-6 w-6 text-green-600" />
            <span className="font-semibold">ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span className="font-semibold">PCI DSS Level 1</span>
          </div>
        </div>
      </div>
    </section>
  );
}
