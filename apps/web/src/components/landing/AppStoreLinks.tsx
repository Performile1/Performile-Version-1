import React from 'react';
import { Download, Smartphone } from 'lucide-react';

interface AppStoreLinksProps {
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export function AppStoreLinks({ variant = 'dark', size = 'md' }: AppStoreLinksProps) {
  // Replace these with actual App Store URLs when apps are published
  const APP_STORE_URL = 'https://apps.apple.com/app/performile/id123456789';
  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.performile.app';

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const buttonClass = `flex items-center gap-3 ${
    variant === 'dark' ? 'bg-black text-white hover:bg-gray-900' : 'bg-white text-gray-900 hover:bg-gray-100'
  } ${sizeClasses[size]} rounded-lg transition-colors shadow-lg`;

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      {/* App Store Button */}
      <a
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        onClick={(e) => {
          // Track analytics
          if (window.gtag) {
            window.gtag('event', 'click', {
              event_category: 'App Store',
              event_label: 'iOS Download',
            });
          }
        }}
      >
        <Download className="h-5 w-5" />
        <div className="text-left">
          <div className="text-xs opacity-80">Download on the</div>
          <div className="font-semibold">App Store</div>
        </div>
      </a>

      {/* Google Play Button */}
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClass}
        onClick={(e) => {
          // Track analytics
          if (window.gtag) {
            window.gtag('event', 'click', {
              event_category: 'App Store',
              event_label: 'Android Download',
            });
          }
        }}
      >
        <Download className="h-5 w-5" />
        <div className="text-left">
          <div className="text-xs opacity-80">GET IT ON</div>
          <div className="font-semibold">Google Play</div>
        </div>
      </a>
    </div>
  );
}

// Compact version for footer or sidebar
export function AppStoreLinksCompact() {
  return (
    <div className="flex gap-3">
      <a
        href="https://apps.apple.com/app/performile/id123456789"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        title="Download on App Store"
      >
        <Smartphone className="h-6 w-6" />
      </a>
      <a
        href="https://play.google.com/store/apps/details?id=com.performile.app"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-12 h-12 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        title="Get it on Google Play"
      >
        <Smartphone className="h-6 w-6" />
      </a>
    </div>
  );
}
