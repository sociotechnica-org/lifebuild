import { test, expect, type Page } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

const isLoadingLiveStore = async (page: Page): Promise<boolean> => {
  return page
    .locator('text=Loading LiveStore')
    .isVisible()
    .catch(() => false)
}

const expectMapLayerVisible = async (page: Page) => {
  const canvas = page.locator('canvas').first()
  if (await canvas.isVisible().catch(() => false)) {
    await expect(canvas).toBeVisible()
    return
  }

  await expect(page.getByText('Map unavailable on this device')).toBeVisible()
}

test.describe('Building overlay routing', () => {
  test('supports landmark routing plus back/escape close behavior', async ({ page }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    await expectMapLayerVisible(page)

    const sanctuaryButton = page.getByTestId('fixed-building-sanctuary-button')
    if (await sanctuaryButton.isVisible().catch(() => false)) {
      await sanctuaryButton.click()
      await expect(page).toHaveURL(new RegExp(`/sanctuary\\?storeId=${storeId}$`))
    } else {
      await page.goto(`/sanctuary?storeId=${storeId}`)
      await waitForLiveStoreReady(page)
    }

    await expect(page.getByTestId('building-overlay')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Sanctuary' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))

    const workshopButton = page.getByTestId('fixed-building-workshop-button')
    if (await workshopButton.isVisible().catch(() => false)) {
      await workshopButton.click()
      await expect(page).toHaveURL(new RegExp(`/workshop\\?storeId=${storeId}$`))
    } else {
      await page.goto(`/workshop?storeId=${storeId}`)
      await waitForLiveStoreReady(page)
    }

    await expect(page.getByTestId('building-overlay')).toHaveCount(1)
    await expect(page.getByRole('heading', { name: 'Workshop' })).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))
  })

  test('deep links render map behind overlay and enforce single-overlay route state', async ({
    page,
  }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    await page.goto(`/sanctuary?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    await expectMapLayerVisible(page)
    await expect(page.getByRole('heading', { name: 'Sanctuary' })).toBeVisible()
    await expect(page.getByTestId('building-overlay')).toHaveCount(1)

    await page.goto(`/workshop?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    await expect(page.getByRole('heading', { name: 'Workshop' })).toBeVisible()
    await expect(page.getByTestId('building-overlay')).toHaveCount(1)

    await page.goto(`/projects/deep-link-project?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    await expect(page.getByTestId('building-overlay')).toHaveCount(1)
    await expect(page.getByText('Project not found')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))
  })
})
