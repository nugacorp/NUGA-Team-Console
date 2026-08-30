/// <reference types="vite/client" />

export type AppMode = 'demo' | 'staging' | 'production';

interface ImportMetaEnv {
  readonly VITE_APP_MODE?: AppMode;
  readonly VITE_NUGA_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
