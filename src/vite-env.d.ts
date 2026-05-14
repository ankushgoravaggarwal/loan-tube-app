/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLARITY_PROJECT_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_LEADS_API_URL?: string;
  readonly VITE_BACKEND_BASE_URL?: string;
  /** Full URL for redirect when application-result returns INVALID_TAG (default: https://www.loantube.com/). */
  readonly VITE_MAIN_SITE_URL?: string;
  /** Full URL for affiliate lead POST (default: `{VITE_BACKEND_BASE_URL}/affiliates/lead`). */
  readonly VITE_AFFILIATE_LEAD_URL?: string;
  readonly VITE_AFFILIATE_API_ID?: string;
  readonly VITE_AFFILIATE_API_PASSWORD?: string;
  /** Set to 'false' at build time to hide offer-page support reference; omitted or other values = shown. */
  readonly VITE_SHOW_OFFER_SUPPORT_REFERENCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
