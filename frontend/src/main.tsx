import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initSentry } from './config/sentry';
import { initAnalytics } from './lib/analytics';

// Initialize Sentry as early as possible
initSentry();

// Initialize PostHog analytics
initAnalytics();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
