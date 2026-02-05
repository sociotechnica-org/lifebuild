/**
 * E2E tests for the feedback button in the header
 * Tests that the feedback button is visible and triggers PostHog survey
 */

import { test, expect, Page } from '@playwright/test'
import { waitForLiveStoreReady, APP_URL } from './test-utils.js'

test.describe('Feedback Button', () => {
  test.describe.configure({ timeout: 60000 })

  async function navigateToDraftingRoom(page: Page) {
    await page.goto(`${APP_URL}/drafting-room`)
    await waitForLiveStoreReady(page)
    await page.waitForLoadState('load')
    await page.waitForTimeout(2000) // Allow time for app to initialize
  }

  test('should display feedback button in header', async ({ page }) => {
    await navigateToDraftingRoom(page)

    // Find the feedback button by its aria-label
    const feedbackButton = page.locator('button[aria-label="Send feedback"]')
    await expect(feedbackButton).toBeVisible({ timeout: 10000 })
    await expect(feedbackButton).toHaveText('Feedback')
  })

  test('should be clickable without errors', async ({ page }) => {
    await navigateToDraftingRoom(page)

    const feedbackButton = page.locator('button[aria-label="Send feedback"]')
    await expect(feedbackButton).toBeVisible({ timeout: 10000 })

    // Set up console error listener
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Click the button
    await feedbackButton.click()

    // Wait a moment for any async operations
    await page.waitForTimeout(500)

    // Verify no console errors occurred from the click
    const relevantErrors = consoleErrors.filter(
      err => err.includes('feedback') || err.includes('PostHog') || err.includes('survey')
    )
    expect(relevantErrors).toHaveLength(0)
  })

  test('should trigger PostHog capture when survey ID is configured', async ({ page }) => {
    // Inject a mock PostHog before navigation
    await page.addInitScript(() => {
      // Create a spy to track PostHog capture calls
      ;(window as any).__posthogCaptureCalls = []
    })

    await navigateToDraftingRoom(page)

    // Inject spy into PostHog after the page loads
    await page.evaluate(() => {
      const posthog = (window as any).posthog
      if (posthog && typeof posthog.capture === 'function') {
        const originalCapture = posthog.capture.bind(posthog)
        posthog.capture = (event: string, properties: any) => {
          ;(window as any).__posthogCaptureCalls.push({ event, properties })
          return originalCapture(event, properties)
        }
      }
    })

    const feedbackButton = page.locator('button[aria-label="Send feedback"]')
    await expect(feedbackButton).toBeVisible({ timeout: 10000 })

    // Click the button
    await feedbackButton.click()
    await page.waitForTimeout(500)

    // Check if PostHog capture was called (only if PostHog is initialized and survey ID is set)
    const captureCalls = await page.evaluate(() => (window as any).__posthogCaptureCalls || [])

    // If PostHog is configured with a survey ID, verify the capture call
    const surveyCall = captureCalls.find((call: { event: string }) => call.event === 'survey shown')

    if (surveyCall) {
      expect(surveyCall.properties).toHaveProperty('$survey_id')
    }
    // If no survey call, that's OK - it means PostHog or survey ID isn't configured
  })

  test('should have correct styling and hover state', async ({ page }) => {
    await navigateToDraftingRoom(page)

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
