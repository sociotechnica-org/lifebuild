// @ts-check
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

// Read package version for release tracking
const packageJson = JSON.parse(readFileSync(path.resolve('./package.json'), 'utf-8'))

const shouldAnalyze = process.env.VITE_ANALYZE !== undefined
const isProdBuild = process.env.NODE_ENV === 'production'

// https://vitejs.dev/config
export default defineConfig({
  define: {
    // Make version available at runtime via import.meta.env
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 60_001,
    watch: {
      ignored: ['**/docs/**', '**/node_modules/**'],
    },
  },
  worker: isProdBuild ? { format: 'es' } : undefined,
  optimizeDeps: {
    // TODO remove once fixed https://github.com/vitejs/vite/issues/8427
    exclude: ['@livestore/wa-sqlite'],
  },
  plugins: [
    tailwindcss(),
    react(),
    livestoreDevtoolsPlugin({
      schemaPath: '../shared/src/livestore/schema.ts',
      // Ensure devtools are enabled in production too
      enabled: true,
    }),
    // @ts-expect-error plugin types seem to be wrong
    shouldAnalyze
      ? visualizer({
          filename: path.resolve('./node_modules/.stats/index.html'),
          gzipSize: true,
          brotliSize: true,
        })
      : undefined,
    // Upload source maps to Sentry in production builds
    isProdBuild && process.env.SENTRY_AUTH_TOKEN
      ? sentryVitePlugin({
          authToken: process.env.SENTRY_AUTH_TOKEN,
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          // Use same release identifier as runtime to ensure source maps are matched
          release: {
            name: `${packageJson.name}@${packageJson.version}`,
          },
          telemetry: false,
        })
      : undefined,
  ],
  build: {
    // Generate source maps for Sentry
    sourcemap: true,
  },
})
