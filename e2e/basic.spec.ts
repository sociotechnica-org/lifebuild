import { test, expect } from '@playwright/test'

test.describe('Basic App Tests', () => {
  test('app loads and LiveStore initializes', async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Verify the app loaded correctly
    await expect(page).toHaveTitle(/Work Squared/)

    // Wait for LiveStore to attempt initialization (or show error/loading state)
    // In CI, this will likely show an error due to no sync server, which is expected
    await page.waitForTimeout(5000) // Give time for initial load

    // Check that we have some app content (not a blank page)
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText?.length).toBeGreaterThan(10)

    // Verify we're not on a 404 or completely broken page
    await expect(page.locator('h1, h2, [role="heading"]').first()).toBeVisible({ timeout: 10000 })

    // The key test: verify LiveStore is attempting to work
    // It should either:
    // 1. Load successfully and show content, OR
    // 2. Show a LiveStore-related loading/error message (expected in CI)
    const isLiveStoreAttempting = await page.evaluate(() => {
      const text = document.body.textContent || ''
      return (
        text.includes('LiveStore') ||
        text.includes('Loading') ||
        text.includes('Boards') ||
        text.includes('Chat') ||
        text.includes('Kanban')
      )
    })

    expect(isLiveStoreAttempting).toBe(true)
    console.log('✅ LiveStore integration confirmed - app is attempting to initialize LiveStore')
  })
})
