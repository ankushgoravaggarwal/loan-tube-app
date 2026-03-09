import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

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
