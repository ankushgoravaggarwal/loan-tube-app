/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_LEADS_API_URL?: string;
  readonly VITE_BACKEND_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
