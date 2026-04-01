/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLARITY_PROJECT_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_LEADS_API_URL?: string;
  readonly VITE_BACKEND_BASE_URL?: string;
  /** Set to 'false' at build time to hide offer-page support reference; omitted or other values = shown. */
  readonly VITE_SHOW_OFFER_SUPPORT_REFERENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
