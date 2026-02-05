/// <reference types="vite/client" />
/// <reference types="@livestore/sync-cf" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_POSTHOG_KEY?: string
  readonly VITE_PUBLIC_POSTHOG_HOST?: string
  readonly VITE_POSTHOG_FEEDBACK_SURVEY_ID?: string
  readonly VITE_LIVESTORE_DEVTOOLS_LICENSE?: string
  readonly VITE_LSD_LICENSE?: string
}

declare module '@livestore/devtools-vite/dist/devtools-bundle/index.js' {
  export const run: (options: {
    schemas: unknown[]
    license?: string
    sharedWorker?: unknown
    mode?: unknown
    mountPath?: string
    __website?: {
      initialRoute?: string
      rootEl?: HTMLElement | null
      portalEl?: HTMLElement | null
    }
  }) => void
}

declare module '@livestore/devtools-vite/dist/devtools-bundle/devtools-vite.css' {
  const url: string
  export default url
}
