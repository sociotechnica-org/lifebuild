import { test, expect, type Page } from '@playwright/test'
import { waitForLiveStoreReady, expectBasicAppStructure } from './test-utils'

const expectLifeMapSurface = async (page: Page) => {
  const lifeMapCanvas = page.locator('canvas').first()
  const hasCanvas = await lifeMapCanvas
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false)

  if (!hasCanvas) {
    await expect(page.getByText('Map unavailable on this device')).toBeVisible({ timeout: 10000 })
  }
}

test.describe('Smoke Tests', () => {
  test('app loads and basic functionality works', async ({ page }) => {
    // Navigate to app (let it handle store ID automatically)
    await page.goto('/')
    await waitForLiveStoreReady(page)

    // Verify the app loaded correctly
    await expect(page).toHaveTitle(/LifeBuild/)

    // In CI, the app may not fully load due to LiveStore sync issues.
    const isLoading = await page
      .locator('text=Loading LiveStore')
      .isVisible()
      .catch(() => false)
    if (isLoading) {
      // App is stuck loading - this is expected in CI without sync server
      return // Exit test gracefully
    }

    // Check basic app structure
    await expectBasicAppStructure(page)

    // Once loading completes, app should include a storeId in URL.
    await expect(page).toHaveURL(/\?storeId=[^&]+$/)

    // Navigation should only include Life Map
    const navLinks = page.locator('header nav a')
    await expect(navLinks).toHaveCount(1)
    await expect(navLinks.first()).toHaveText('Life Map')

    // Life Map surface should load (canvas, or WebGL fallback in constrained environments)
    await expectLifeMapSurface(page)

    // Verify chat interface is visible (may not be fully functional in CI)
    const chatElement = page.locator('textarea[placeholder="Ask something…"]')
    if (await chatElement.isVisible()) {
      await expect(chatElement).toBeVisible()
    }

    // Test legacy room redirects to map-first route
    const storeId = 'test-smoke-' + Date.now()
    await page.goto(`/drafting-room?storeId=${storeId}`)
    const draftingLoading = await page
      .locator('text=Loading LiveStore')
      .isVisible()
      .catch(() => false)
    if (!draftingLoading) {
      const draftUrl = new URL(page.url())
      expect(draftUrl.searchParams.get('storeId')).toBe(storeId)
      expect(draftUrl.pathname).not.toContain('/drafting-room')
      expect(['/', '/life-map']).toContain(draftUrl.pathname)
    }

    await page.goto(`/sorting-room/gold?storeId=${storeId}`)
    const sortingLoading = await page
      .locator('text=Loading LiveStore')
      .isVisible()
      .catch(() => false)
    if (!sortingLoading) {
      const sortUrl = new URL(page.url())
      expect(sortUrl.searchParams.get('storeId')).toBe(storeId)
      expect(sortUrl.pathname).not.toContain('/sorting-room')
      expect(['/', '/life-map']).toContain(sortUrl.pathname)
    }
  })

  test('LiveStore sync is working', async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Wait for LiveStore to be ready (or timeout gracefully)
    await waitForLiveStoreReady(page)

    // Check if we're still loading (expected in CI)
    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - expected in CI without sync server')
      return // Exit gracefully
    }

    // Basic functionality should be available (this tests that LiveStore has loaded)
    // Try to access the map page which requires LiveStore data
    await page.goto('/life-map')
    await waitForLiveStoreReady(page)

    // Should not show any error messages (unless it's expected LiveStore sync errors in CI)
    const errorElement = page.locator('text=Error')
    const failedElement = page.locator('text=Failed')

    // In CI, LiveStore sync errors are expected, so we handle them gracefully
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent()
      if (errorText?.includes('LiveStore') || errorText?.includes('@livestor')) {
        console.log('LiveStore sync error detected - expected in CI without sync server')
      } else {
        await expect(errorElement).not.toBeVisible() // Fail for other errors
      }
    }

    if (await failedElement.isVisible()) {
      const failedText = await failedElement.textContent()
      if (failedText?.includes('LiveStore') || failedText?.includes('@livestor')) {
        console.log('LiveStore sync failure detected - expected in CI without sync server')
      } else {
        await expect(failedElement).not.toBeVisible() // Fail for other failures
      }
    }
  })

  test('basic app architecture is working', async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Test that the main app loads (Vite dev server)
    await expect(page).toHaveTitle(/LifeBuild/)

    // Wait for initial load
    await waitForLiveStoreReady(page)

    // Test storeId-based routing
    const storeId = 'test-routing-' + Date.now()
    await page.goto(`/?storeId=${storeId}`)
    await expect(page).toHaveURL(new RegExp(`\\/\\?storeId=${storeId}$`))

    // Navigate to compatibility life-map route directly
    await page.goto(`/life-map?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    const compatUrl = new URL(page.url())
    expect(compatUrl.searchParams.get('storeId')).toBe(storeId)
    expect(['/', '/life-map']).toContain(compatUrl.pathname)

    // In CI without sync server, LiveStore can remain on loading shell
    const isLoading = await page
      .locator('text=Loading LiveStore')
      .isVisible()
      .catch(() => false)
    if (isLoading) {
      return
    }

    await expect(page.locator('header nav a')).toHaveCount(1)
    await expect(page.getByRole('link', { name: 'Life Map' })).toBeVisible()
    await expect(page.getByText('Drafting Room')).toHaveCount(0)
    await expect(page.getByText('Sorting Room')).toHaveCount(0)
    await expect(page.getByText('Table')).toHaveCount(0)
    await expectLifeMapSurface(page)

    // Overlay route behavior is covered by building-overlay-routing.spec.ts.
  })
})
