import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

const TOUR_STORAGE_KEY = 'performile_merchant_tour_seen_v1';

type ShepherdTour = any;

export function useMerchantDashboardTour(enabled: boolean) {
  const tourRef = useRef<ShepherdTour | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (tourRef.current) {
        tourRef.current.destroy();
        tourRef.current = null;
      }
      return;
    }

    // Destroy existing tour before creating a new instance (strict mode safety)
    if (tourRef.current) {
      tourRef.current.destroy();
      tourRef.current = null;
    }

    const tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        cancelIcon: {
          enabled: true,
        },
        scrollTo: {
          behavior: 'smooth',
          block: 'center',
        },
        classes: 'performile-tour',
      },
    });

    const safeSetSeen = () => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      }
    };

    const steps = [
      {
        id: 'merchant-tour-welcome',
        title: 'Welcome to your merchant dashboard',
        text: 'Let\'s walk through the high-impact areas so you can configure couriers and monitor performance with confidence.',
        attachTo: {
          element: '#merchant-tour-welcome',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Skip',
            secondary: true,
            action: () => {
              safeSetSeen();
              tour.cancel();
            },
          },
          {
            text: 'Next',
            action: tour.next,
          },
        ],
      },
      {
        id: 'merchant-tour-kpis',
        title: 'Track courier KPIs',
        text: 'These cards highlight on-time rate, completion rate, and how many couriers you have available. Watch these numbers as you tweak your courier mix.',
        attachTo: {
          element: '#merchant-tour-kpis',
          on: 'bottom',
        },
        buttons: [
          {
            text: 'Back',
            secondary: true,
            action: tour.back,
          },
          {
            text: 'Next',
            action: tour.next,
          },
        ],
      },
      {
        id: 'merchant-tour-orders',
        title: 'Understand checkout performance',
        text: 'Order and claims trends refresh with the latest checkout analytics so you can see how courier capability filters impact conversion.',
        attachTo: {
          element: '#merchant-tour-orders',
          on: 'top',
        },
        buttons: [
          {
            text: 'Back',
            secondary: true,
            action: tour.back,
          },
          {
            text: 'Next',
            action: tour.next,
          },
        ],
      },
      {
        id: 'merchant-tour-quick-actions',
        title: 'Configure couriers in seconds',
        text: 'Quick Actions gives you shortcuts into courier selection, returns, and policy updates—perfect after applying new drop-off filters.',
        attachTo: {
          element: '#merchant-tour-quick-actions',
          on: 'top',
        },
        buttons: [
          {
            text: 'Back',
            secondary: true,
            action: tour.back,
          },
          {
            text: 'Next',
            action: tour.next,
          },
        ],
      },
      {
        id: 'merchant-tour-tracking',
        title: 'Keep customers in the loop',
        text: 'The live tracking widget mirrors what consumers see. Use it to sanity-check delivery promises before you promote new courier options.',
        attachTo: {
          element: '#merchant-tour-tracking',
          on: 'left',
        },
        buttons: [
          {
            text: 'Back',
            secondary: true,
            action: tour.back,
          },
          {
            text: 'Finish',
            action: () => {
              safeSetSeen();
              tour.complete();
            },
          },
        ],
      },
    ];

    steps.forEach((step) => {
      tour.addStep(step as any);
    });

    tourRef.current = tour;

    let autoStartTimer: number | undefined;

    if (typeof window !== 'undefined' && !window.localStorage.getItem(TOUR_STORAGE_KEY)) {
      autoStartTimer = window.setTimeout(() => {
        if (tourRef.current) {
          tourRef.current.start();
          safeSetSeen();
        }
      }, 500);
    }

    return () => {
      if (autoStartTimer) {
        window.clearTimeout(autoStartTimer);
      }
      tour.destroy();
      tourRef.current = null;
    };
  }, [enabled]);

  const startTour = () => {
    if (!enabled) {
      return;
    }

    if (tourRef.current) {
      tourRef.current.start();
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      }
    }
  };

  return { startTour };
}
