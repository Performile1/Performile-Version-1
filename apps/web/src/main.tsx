import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initSentry } from './config/sentry';
import { initAnalytics } from './lib/analytics';
import { ErrorBoundary } from './components/ErrorBoundary';

// Initialize Sentry as early as possible
initSentry();

// Initialize PostHog analytics only if explicitly enabled
// Disabled by default to prevent errors in production
if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
  initAnalytics();
} else {
  console.info('📊 Analytics disabled (set VITE_ENABLE_ANALYTICS=true to enable)');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
