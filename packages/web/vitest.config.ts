/// <reference types="vitest" />
/// <reference types="vitest/globals" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react() as any],
  // React.act is only exported in development mode. Since unit tests with
  // @testing-library/react require act(), we need NODE_ENV=development.
  // Production behavior is tested via Playwright E2E tests instead.
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/test-utils.tsx'],
    globals: true,
    // Include files to test
    include: ['./src/**/*.{test,spec}.{js,ts,jsx,tsx}', './tests/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    // Exclude E2E tests (handled by Playwright)
    exclude: ['./tests/e2e/**/*', 'node_modules/**/*'],
    // Mock CSS imports
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
  resolve: {
    alias: {
      '@': './src',
    },
  },
})
