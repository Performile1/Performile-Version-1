import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export function GoogleAnalytics({ measurementId = 'G-XXXXXXXXXX' }: GoogleAnalyticsProps) {
  const location = useLocation();

  useEffect(() => {
    // Load Google Analytics script
    if (!window.gtag) {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${measurementId}', {
          page_path: window.location.pathname,
        });
      `;
      document.head.appendChild(script2);
    }
  }, [measurementId]);

  useEffect(() => {
    // Track page views on route change
    if (window.gtag) {
      window.gtag('config', measurementId, {
        page_path: location.pathname + location.search,
      });
    }
  }, [location, measurementId]);

  return null;
}

// Helper functions for tracking events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

export const trackButtonClick = (buttonName: string, location: string) => {
  trackEvent('click', 'Button', `${buttonName} - ${location}`);
};

export const trackFormSubmit = (formName: string) => {
  trackEvent('submit', 'Form', formName);
};

export const trackSignup = (method: string) => {
  if (window.gtag) {
    window.gtag('event', 'sign_up', {
      method: method,
    });
  }
};

export const trackPurchase = (value: number, currency: string = 'EUR') => {
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      value: value,
      currency: currency,
    });
  }
};
