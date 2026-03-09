import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Sentry (error monitoring, replay). Override DSN with VITE_SENTRY_DSN in .env
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN ?? 'https://282e457cc12a75d0698ee6874c3c8671@o423909.ingest.us.sentry.io/4511002444169216',
  sendDefaultPii: true,
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Microsoft Clarity (session replay, heatmaps). Override with VITE_CLARITY_PROJECT_ID in .env
const clarityId = import.meta.env.VITE_CLARITY_PROJECT_ID ?? 'vt37gtwhsa';
if (typeof document !== 'undefined') {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${clarityId}`;
  document.head.appendChild(script);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
