import { test, expect } from '@playwright/test'
import { waitForLiveStoreReady, expectBasicAppStructure } from './test-utils'

test.describe('Smoke Tests', () => {
  test('app loads and basic functionality works', async ({ page }) => {
    // Navigate to app (let it handle store ID automatically)
    await page.goto('/')
    await waitForLiveStoreReady(page)

    // Verify the app loaded correctly
    await expect(page).toHaveTitle(/Work Squared/)

    // Check basic app structure
    await expectBasicAppStructure(page)

    // Should redirect to /boards by default
    await expect(page).toHaveURL(/\/boards/)

    // Verify chat interface is always visible (it's a side panel)
    await expect(page.locator('textarea[placeholder="Type your message..."]')).toBeVisible()

    // Test navigation by going directly to /chat route
    await page.goto('/chat')
    await waitForLiveStoreReady(page)
    await expect(page).toHaveURL(/\/chat/)

    // Navigate back to boards
    await page.goto('/boards')
    await waitForLiveStoreReady(page)
    await expect(page).toHaveURL(/\/boards/)
  })

  test('LiveStore sync is working', async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Wait for LiveStore to be ready
    await waitForLiveStoreReady(page)

    // Verify no loading states are present
    await expect(page.locator('text=Loading LiveStore')).not.toBeVisible()

    // Basic functionality should be available (this tests that LiveStore has loaded)
    // Try to access the boards page which requires LiveStore data
    await page.goto('/boards')
    await waitForLiveStoreReady(page)

    // Should not show any error messages
    await expect(page.locator('text=Error')).not.toBeVisible()
    await expect(page.locator('text=Failed')).not.toBeVisible()
  })

  test('multi-service architecture is working', async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Test that the main app loads (Vite dev server)
    await expect(page).toHaveTitle(/Work Squared/)

    // Test that sync server connection works (Cloudflare Workers)
    // This is indicated by LiveStore finishing loading without errors
    await waitForLiveStoreReady(page)
    await expect(page.locator('text=Loading LiveStore')).not.toBeVisible()

    // Navigate to chat route to verify the UI is functional
    await page.goto('/chat')
    await waitForLiveStoreReady(page)
    await expect(page).toHaveURL(/\/chat/)

    // Verify basic page structure is working
    await expectBasicAppStructure(page)
  })
})
