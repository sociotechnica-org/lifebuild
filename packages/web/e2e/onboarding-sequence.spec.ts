import { expect, test, type Page } from '@playwright/test'
import { waitForLiveStoreReady } from './test-utils'

const hasMapCanvas = async (page: Page): Promise<boolean> => {
  return page
    .locator('canvas')
    .first()
    .isVisible()
    .catch(() => false)
}

test.describe('Onboarding sequence', () => {
  test('runs campfire -> reveal -> first project and persists completion after refresh', async ({
    page,
  }) => {
    const storeId = `onboarding-${Date.now()}-${Math.random().toString(36).slice(2)}`

    await page.goto(`/life-map?storeId=${storeId}&onboarding=force`)
    await waitForLiveStoreReady(page)

    if (!(await hasMapCanvas(page))) {
      return
    }

    await expect(page.getByTestId('onboarding-campfire-panel')).toBeVisible()
    await expect(page.getByTestId('onboarding-fog-overlay')).toBeVisible()
    await expect(page.getByTestId('attendant-rail')).toHaveCount(0)
    await expect(page.getByTestId('task-queue-panel')).toHaveCount(0)

    await page.getByTestId('onboarding-project-name').fill('My first onboarding project')
    await page
      .getByTestId('onboarding-project-description')
      .fill('Create momentum with a small, visible first win.')
    await page.getByTestId('onboarding-create-project').click()

    await expect(page.getByTestId('onboarding-reveal-panel')).toBeVisible()
    await expect(page.getByTestId('onboarding-first-project-banner')).toBeVisible({
      timeout: 10000,
    })

    await expect(page.getByTestId('attendant-rail')).toBeVisible()
    await expect(page.getByTestId('attendant-rail-notification-marvin')).toBeVisible()

    const firstProjectTile = page.locator('[data-testid^="hex-tile-button-"]').first()
    await expect(firstProjectTile).toBeVisible({ timeout: 10000 })
    await firstProjectTile.click()

    await expect(page).toHaveURL(
      new RegExp(`/projects/.+\\?storeId=${storeId}(?:&onboarding=force)?$`)
    )
    await expect(page.getByTestId('building-overlay')).toBeVisible()
    await expect(page.getByTestId('attendant-chat-panel')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}(?:&onboarding=force)?$`))

    await page.reload()
    await waitForLiveStoreReady(page)

    await expect(page.getByTestId('onboarding-campfire-panel')).toHaveCount(0)
    await expect(page.getByTestId('onboarding-first-project-banner')).toHaveCount(0)
    await expect(page.getByTestId('onboarding-fog-overlay')).toHaveCount(0)
    await expect(page.getByTestId('attendant-rail')).toBeVisible()
  })
})
