/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_REAL_AUDIT?: string;
  readonly VITE_AUDIT_API_URL?: string;
  readonly VITE_CHART_SOURCE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
