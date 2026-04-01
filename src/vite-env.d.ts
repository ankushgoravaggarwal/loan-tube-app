/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLARITY_PROJECT_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_LEADS_API_URL?: string;
  readonly VITE_BACKEND_BASE_URL?: string;
  /** When 'true', offer page shows expandable tag/support reference (staging; off in production). */
  readonly VITE_SHOW_OFFER_SUPPORT_REFERENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
