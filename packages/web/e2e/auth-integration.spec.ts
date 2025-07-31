/**
 * E2E tests for authentication integration
 * Tests the complete user flow from login to event creation with metadata
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'https://work-squared-auth.jessmartin.workers.dev'
const APP_URL = process.env.APP_URL || 'http://localhost:5173'

/**
 * Helper to create a test user via API
 * Currently unused - will be needed when auth tests are re-enabled in Milestone 3
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function createTestUser() {
  const testEmail = `e2e-test-${Date.now()}@example.com`
  const testPassword = 'E2ETestPassword123!'

  const response = await fetch(`${AUTH_SERVICE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${response.status}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(`Test user creation failed: ${data.error?.message}`)
  }

  return {
    email: testEmail,
    password: testPassword,
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

/**
 * Helper to inject auth tokens into browser
 * Currently unused - will be needed when auth tests are re-enabled in Milestone 3
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function injectAuthTokens(page: Page, accessToken: string, refreshToken: string, user: any) {
  await page.addInitScript(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('work-squared-access-token', accessToken)
      localStorage.setItem('work-squared-refresh-token', refreshToken)
      localStorage.setItem('work-squared-user-info', JSON.stringify(user))
    },
    { accessToken, refreshToken, user }
  )
}

test.describe('Authentication Integration E2E', () => {
  test.describe.configure({ timeout: 60000 }) // 60 second timeout for auth tests

  test.skip('should work with valid authentication tokens', async ({ _page }) => {
    // Skip: Auth is currently disabled (REQUIRE_AUTH=false) in development
    // This test will be enabled when auth is enforced in Milestone 3
    console.log('Skipping auth test - REQUIRE_AUTH=false in development')
  })

  test.skip('should create events with user metadata', async ({ _page }) => {
    // Skip: Event metadata functionality was removed from Milestone 2
    // This will be implemented in Milestone 4: Event Metadata Attribution
    console.log('Skipping metadata test - event metadata removed for future PR')
  })

  test.skip('should handle token refresh gracefully', async ({ _page }) => {
    // Skip: Auth service integration will be tested when auth is enforced in Milestone 3
    console.log('Skipping token refresh test - auth service integration pending')
  })

  test('should work in development mode without auth tokens', async ({ page }) => {
    // This tests the current behavior: REQUIRE_AUTH=false allows development access
    // The app should use the insecure token automatically

    // Navigate to app without pre-injecting any auth tokens
    await page.goto(APP_URL)

    // Use load state instead of networkidle to avoid hanging
    await page.waitForLoadState('load', { timeout: 30000 })
    await page.waitForTimeout(3000) // Give LiveStore time to initialize

    // App should work in development mode
    await expect(page).toHaveURL(new RegExp(APP_URL))

    // Should not show auth errors since auth is disabled
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('Authentication required')
    expect(bodyText).not.toContain('Please log in')

    // App should be functional - basic content should be visible
    const hasContent = await page.locator('body').isVisible()
    expect(hasContent).toBeTruthy()
  })

  test('should handle development mode gracefully', async ({ page }) => {
    // Test current development setup where auth is optional

    // Navigate to app
    await page.goto(APP_URL)

    // Use load state instead of networkidle to avoid hanging
    await page.waitForLoadState('load', { timeout: 30000 })
    await page.waitForTimeout(2000) // Brief wait for app initialization

    // App should not crash or show error pages
    await expect(page).toHaveURL(new RegExp(APP_URL))

    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('Error')
    expect(bodyText).not.toContain('500')
    expect(bodyText).not.toContain('Failed to load')

    // Should show the main app interface
    const appLoaded = await page.locator('body').isVisible()
    expect(appLoaded).toBeTruthy()
  })
})
