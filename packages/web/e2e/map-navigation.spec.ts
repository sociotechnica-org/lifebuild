import { test, expect, type Locator, type Page } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

const isLoadingLiveStore = async (page: Page): Promise<boolean> => {
  return page
    .locator('text=Loading LiveStore')
    .isVisible()
    .catch(() => false)
}

const expectMapVisible = async (page: Page): Promise<Locator | null> => {
  const canvas = page.locator('canvas').first()
  const hasCanvas = await canvas
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false)

  if (!hasCanvas) {
    await expect(page.getByText('Map unavailable on this device')).toBeVisible({ timeout: 10000 })
    return null
  }

  return canvas
}

const getCenter = async (locator: Locator): Promise<{ x: number; y: number }> => {
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error('Expected element to have a bounding box')
  }

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test.describe('Map navigation', () => {
  test('supports wheel zoom and arrow-key pan controls', async ({ page }) => {
    await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    const canvas = await expectMapVisible(page)
    if (!canvas) {
      return
    }

    const sanctuaryButton = page.getByTestId('fixed-building-sanctuary-button')
    const workshopButton = page.getByTestId('fixed-building-workshop-button')
    await expect(sanctuaryButton).toBeVisible({ timeout: 10000 })
    await expect(workshopButton).toBeVisible({ timeout: 10000 })

    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) {
      return
    }

    const sanctuaryBeforeZoom = await getCenter(sanctuaryButton)
    const workshopBeforeZoom = await getCenter(workshopButton)
    const distanceBeforeZoom = Math.abs(workshopBeforeZoom.x - sanctuaryBeforeZoom.x)

    await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2)
    await page.mouse.wheel(0, -900)
    await page.waitForTimeout(150)

    const sanctuaryAfterZoom = await getCenter(sanctuaryButton)
    const workshopAfterZoom = await getCenter(workshopButton)
    const distanceAfterZoom = Math.abs(workshopAfterZoom.x - sanctuaryAfterZoom.x)

    expect(distanceAfterZoom).toBeGreaterThan(distanceBeforeZoom + 1)

    const sanctuaryBeforePan = await getCenter(sanctuaryButton)
    await page.keyboard.down('ArrowRight')
    await page.waitForTimeout(200)
    await page.keyboard.up('ArrowRight')
    await waitForLiveStoreReady(page)

    const sanctuaryAfterPan = await getCenter(sanctuaryButton)
    expect(Math.abs(sanctuaryAfterPan.x - sanctuaryBeforePan.x)).toBeGreaterThan(1)
  })
})
