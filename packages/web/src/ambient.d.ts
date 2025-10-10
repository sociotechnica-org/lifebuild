/// <reference types="vite/client" />
/// <reference types="@livestore/sync-cf" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_POSTHOG_KEY?: string
  readonly VITE_PUBLIC_POSTHOG_HOST?: string
}
