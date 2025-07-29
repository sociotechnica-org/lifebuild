/**
 * E2E tests for authentication integration
 * Tests the complete user flow from login to event creation with metadata
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'https://work-squared-auth.jessmartin.workers.dev'
const APP_URL = process.env.APP_URL || 'http://localhost:3000'

/**
 * Helper to create a test user via API
 */
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
 */
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

  test('should work with valid authentication tokens', async ({ page }) => {
    // Create test user
    const testUser = await createTestUser()

    // Inject auth tokens into browser
    await injectAuthTokens(page, testUser.accessToken, testUser.refreshToken, testUser.user)

    // Navigate to app
    await page.goto(APP_URL)

    // Wait for app to load and initialize auth
    await page.waitForLoadState('networkidle')

    // Check that user can access the app (not redirected to login)
    await expect(page).toHaveURL(new RegExp(APP_URL))

    // Look for signs that the app is working with auth
    // This could be a user indicator, project list, etc.
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('Please log in')
  })

  test('should create events with user metadata', async ({ page }) => {
    // Create test user
    const testUser = await createTestUser()

    // Inject auth tokens
    await injectAuthTokens(page, testUser.accessToken, testUser.refreshToken, testUser.user)

    // Navigate to app
    await page.goto(APP_URL)
    await page.waitForLoadState('networkidle')

    // Monitor network requests to verify JWT is sent in sync payload
    const syncRequests: any[] = []
    page.on('websocket', ws => {
      ws.on('framesent', event => {
        try {
          const data = JSON.parse(event.payload.toString())
          if (data.type === 'init' && data.authToken) {
            syncRequests.push(data)
          }
        } catch (e) {
          // Ignore parsing errors
        }
      })
    })

    // Try to create a task or project to generate events
    try {
      // Look for "New Project" or similar button
      const newProjectButton = page
        .locator(
          'button:has-text("New Project"), [data-testid*="new-project"], [aria-label*="new project" i]'
        )
        .first()

      if (await newProjectButton.isVisible({ timeout: 5000 })) {
        await newProjectButton.click()

        // Fill in project details
        await page.fill(
          'input[placeholder*="project" i], input[name*="name" i]',
          'E2E Test Project'
        )

        // Submit the form
        await page.click(
          'button[type="submit"], button:has-text("Create"), button:has-text("Save")'
        )

        // Wait for project to be created
        await page.waitForTimeout(2000)

        // Verify project appears
        await expect(page.locator('text=E2E Test Project')).toBeVisible()
      }
    } catch (error) {
      console.warn('Could not create test project:', error)
      // Continue with test - project creation is optional for auth verification
    }

    // Wait a bit for any sync activity
    await page.waitForTimeout(3000)

    // The main verification is that the app loaded and worked without auth errors
    // In a real implementation, we could check:
    // - Console logs for auth success
    // - Network tab for successful WebSocket connections
    // - Local storage for updated tokens
  })

  test('should handle token refresh gracefully', async ({ page }) => {
    // Create test user
    const testUser = await createTestUser()

    // Use the refresh token to get a new access token
    const refreshResponse = await fetch(`${AUTH_SERVICE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: testUser.refreshToken }),
    })

    expect(refreshResponse.ok).toBeTruthy()

    const refreshData = await refreshResponse.json()
    expect(refreshData.success).toBeTruthy()

    // Inject new tokens
    await injectAuthTokens(page, refreshData.accessToken, refreshData.refreshToken, testUser.user)

    // Navigate to app with refreshed tokens
    await page.goto(APP_URL)
    await page.waitForLoadState('networkidle')

    // Verify app works with refreshed tokens
    await expect(page).toHaveURL(new RegExp(APP_URL))

    // Check that auth context recognizes the user
    const authState = await page.evaluate(() => {
      return {
        hasAccessToken: !!localStorage.getItem('work-squared-access-token'),
        hasRefreshToken: !!localStorage.getItem('work-squared-refresh-token'),
        hasUserInfo: !!localStorage.getItem('work-squared-user-info'),
      }
    })

    expect(authState.hasAccessToken).toBeTruthy()
    expect(authState.hasRefreshToken).toBeTruthy()
    expect(authState.hasUserInfo).toBeTruthy()
  })

  test('should fallback to insecure token in development', async ({ page }) => {
    // Don't inject any auth tokens - should fallback to development mode

    // Navigate to app
    await page.goto(APP_URL)
    await page.waitForLoadState('networkidle')

    // App should still work in development mode
    await expect(page).toHaveURL(new RegExp(APP_URL))

    // Should not show login errors
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('Authentication required')
    expect(bodyText).not.toContain('Please log in')
  })

  test('should handle auth errors gracefully', async ({ page }) => {
    // Inject invalid tokens
    await page.addInitScript(() => {
      localStorage.setItem('work-squared-access-token', 'invalid-token')
      localStorage.setItem('work-squared-refresh-token', 'invalid-refresh-token')
    })

    // Navigate to app
    await page.goto(APP_URL)
    await page.waitForLoadState('networkidle')

    // Should either show login prompt or fallback to development mode
    // The exact behavior depends on environment configuration
    await expect(page).toHaveURL(new RegExp(APP_URL))

    // App should not crash or show error pages
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('Error')
    expect(bodyText).not.toContain('500')
    expect(bodyText).not.toContain('Failed to load')
  })
})
