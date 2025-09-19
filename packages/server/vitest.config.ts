import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test', // Set to test environment for logger configuration
    },
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      pino: 'pino',
      'pino-pretty': 'pino-pretty',
    },
  },
})