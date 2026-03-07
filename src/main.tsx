import * as Sentry from '@sentry/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

Sentry.init({
  dsn: 'https://282e457cc12a75d0698ee6874c3c8671@o423909.ingest.us.sentry.io/4511002444169216',
  sendDefaultPii: true,
  integrations: [
    Sentry.replayIntegration(),
  ],
  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions; use 1.0 in dev to see all
  replaysOnErrorSampleRate: 1.0, // 100% of sessions where an error occurred
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
