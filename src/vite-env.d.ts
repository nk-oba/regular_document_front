/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AGENTS_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}