import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    silent: true, // Suppress console output during tests
    env: {
      NODE_ENV: 'test', // Set NODE_ENV to test to enable log suppression
    },
  },
})