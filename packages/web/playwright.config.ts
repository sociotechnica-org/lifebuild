import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

// Robust port handling with validation
const getPort = () => {
  const envPort = process.env.PLAYWRIGHT_PORT
  if (!envPort) return 5173
  const parsed = parseInt(envPort, 10)
  return isNaN(parsed) ? 5173 : parsed
}

const port = getPort()
const syncPort = Number.parseInt(process.env.LIVESTORE_SYNC_PORT || '8787', 10) || 8787
const dashboardPort = Number.parseInt(process.env.SERVER_DASHBOARD_PORT || '3103', 10) || 3103
const serverDashboardToken = process.env.SERVER_DASHBOARD_TOKEN || 'test-bypass-token'

process.env.SERVER_DASHBOARD_PORT = dashboardPort.toString()
process.env.SERVER_DASHBOARD_TOKEN = serverDashboardToken
process.env.LIVESTORE_SYNC_PORT = syncPort.toString()
const baseURL = `http://localhost:${port}`

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Run all tests in both CI and local environments */
  testMatch: '**/*.spec.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run tests in parallel on CI for faster execution */
  workers: process.env.CI ? 4 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'pnpm --filter @lifebuild/worker dev',
      url: `http://localhost:${syncPort}/health`,
      reuseExistingServer: true,
      timeout: 60 * 1000,
      env: {
        ENVIRONMENT: 'development',
        REQUIRE_AUTH: 'false',
        JWT_SECRET: 'test-secret',
        GRACE_PERIOD_SECONDS: '86400',
        SERVER_BYPASS_TOKEN: serverDashboardToken,
        R2_PUBLIC_URL: `http://localhost:${syncPort}/api/images`,
      },
    },
    // Always start auth worker for tests since the app always connects to it
    {
      command: 'cd ../auth-worker && pnpm dev',
      url: 'http://localhost:8788/health',
      reuseExistingServer: true,
      timeout: 60 * 1000,
    },
    {
      command: 'pnpm --filter @lifebuild/server dev:dashboard',
      url: `http://localhost:${dashboardPort}/health`,
      reuseExistingServer: true,
      timeout: 120 * 1000,
      env: {
        PORT: dashboardPort.toString(),
        STORE_IDS: 'playwright-dashboard',
        STORE_DATA_PATH: '.tmp-playwright-data',
        LIVESTORE_SYNC_URL: `ws://localhost:${syncPort}`,
        LIVESTORE_SYNC_HEALTH_URL: `http://localhost:${syncPort}/health`,
        SERVER_BYPASS_TOKEN: serverDashboardToken,
        LIVESTORE_PING_INTERVAL_MS: '1000',
        LIVESTORE_PING_TIMEOUT_MS: '1000',
        NODE_ENV: 'production',
      },
    },
    // Start main app
    {
      command: process.env.CI
        ? `VITE_REQUIRE_AUTH=${process.env.REQUIRE_AUTH || 'false'} VITE_AUTH_SERVICE_URL='http://localhost:8788' VITE_LIVESTORE_SYNC_URL='' pnpm build && pnpm preview --port ${port} --host`
        : `VITE_AUTH_SERVICE_URL='http://localhost:8788' VITE_LIVESTORE_SYNC_URL='http://localhost:8787' PORT=${port} pnpm dev`,
      url: baseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 180 * 1000, // Increased timeout for CI
      env: {
        PORT: port.toString(),
        VITE_REQUIRE_AUTH: process.env.REQUIRE_AUTH || 'false',
        VITE_AUTH_SERVICE_URL: 'http://localhost:8788',
        VITE_LIVESTORE_SYNC_URL: process.env.CI ? '' : 'http://localhost:8787',
      },
    },
  ],
})
