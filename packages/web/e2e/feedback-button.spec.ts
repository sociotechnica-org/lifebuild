/**
 * E2E tests for the feedback button in the header
 * Tests that the feedback button is visible and provides feedback mechanism
 *
 * Note: Testing the PostHog survey vs mailto fallback behavior requires
 * unit tests with mocked environment variables, as Vite's import.meta.env
 * is a build-time replacement not accessible at runtime.
 */

import { test, expect, Page } from '@playwright/test'
import { waitForLiveStoreReady, APP_URL } from './test-utils.js'

test.describe('Feedback Button', () => {
  test.describe.configure({ timeout: 60000 })

  async function navigateToApp(page: Page) {
    await page.goto(`${APP_URL}/life-map`)
    await waitForLiveStoreReady(page)
    await page.waitForLoadState('load')
    await page.waitForTimeout(2000) // Allow time for app to initialize
  }

  test('should display feedback button in header', async ({ page }) => {
    await navigateToApp(page)

    // Find the feedback button by its aria-label
    const feedbackButton = page.locator('button[aria-label="Send feedback"]')
    await expect(feedbackButton).toBeVisible({ timeout: 10000 })
    await expect(feedbackButton).toHaveText('Feedback')
  })

  test('should be clickable without errors', async ({ page }) => {
    await navigateToApp(page)

    const feedbackButton = page.locator('button[aria-label="Send feedback"]')
    await expect(feedbackButton).toBeVisible({ timeout: 10000 })

    // Set up console error listener
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Click the button - should not throw
    await feedbackButton.click()

    // Wait a moment for any async operations
    await page.waitForTimeout(500)

    // Verify no console errors occurred from the click
    const relevantErrors = consoleErrors.filter(
      err => err.includes('feedback') || err.includes('PostHog') || err.includes('survey')
    )
    expect(relevantErrors).toHaveLength(0)
  })

  test('should have correct styling and hover state', async ({ page }) => {
    await navigateToApp(page)

    const feedbackButton = page.locator('button[aria-label="Send feedback"]')
    await expect(feedbackButton).toBeVisible({ timeout: 10000 })

    // Check base styling
    await expect(feedbackButton).toHaveCSS('cursor', 'pointer')

    // Hover over the button
    await feedbackButton.hover()
    await page.waitForTimeout(200) // Wait for transition

    // Button should still be visible and interactive
    await expect(feedbackButton).toBeVisible()
  })
})
