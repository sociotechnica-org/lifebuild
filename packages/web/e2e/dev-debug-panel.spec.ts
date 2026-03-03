import { expect, test, type Page } from '@playwright/test'
import { waitForLiveStoreReady } from './test-utils'

const hasMapCanvas = async (page: Page): Promise<boolean> => {
  return page
    .locator('canvas')
    .first()
    .isVisible()
    .catch(() => false)
}

test.describe('Dev debug panel', () => {
  test('toggles onboarding fog overlay on and off', async ({ page }) => {
    const storeId = `debug-panel-${Date.now()}-${Math.random().toString(36).slice(2)}`

    await page.goto(`/life-map?storeId=${storeId}&onboarding=force`)
    await waitForLiveStoreReady(page)

    if (!(await hasMapCanvas(page))) {
      return
    }

    const debugPanel = page.getByTestId('dev-debug-panel')
    await expect(debugPanel).toBeVisible()
    await page.getByTestId('dev-debug-panel-button').click()
    await expect(page.getByTestId('dev-debug-slider-sanctuary-scale')).toBeVisible()
    await expect(page.getByTestId('dev-debug-slider-workshop-scale')).toBeVisible()
    await expect(page.getByTestId('dev-debug-slider-tree-west-scale')).toBeVisible()
    await expect(page.getByTestId('dev-debug-input-sanctuary-origin-x')).toBeVisible()
    await expect(page.getByTestId('dev-debug-input-tree-west-origin-y')).toBeVisible()

    const sanctuaryOriginXInput = page.getByTestId('dev-debug-input-sanctuary-origin-x')
    await sanctuaryOriginXInput.fill('0.25')
    await expect(sanctuaryOriginXInput).toHaveValue('0.25')

    const fogOverlay = page.getByTestId('onboarding-fog-overlay')
    await expect(fogOverlay).toBeVisible()

    const fogToggle = page.getByTestId('dev-debug-toggle-fog')
    await fogToggle.click()
    await expect(fogOverlay).toHaveCount(0)

    await fogToggle.click()
    await expect(fogOverlay).toBeVisible()
  })
})
