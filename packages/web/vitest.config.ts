/// <reference types="vitest" />
/// <reference types="vitest/globals" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
