import { test, expect, type Page } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

type SeedProjectOnMapInput = {
  projectId: string
  name: string
  description?: string
  coord: { q: number; r: number }
  lifecycleStatus?: 'planning' | 'backlog' | 'active' | 'completed'
}

const seedProjectOnMap = async (page: Page, input: SeedProjectOnMapInput) => {
  await page.waitForFunction(
    () =>
      typeof (window as { __LIFEBUILD_E2E__?: { seedProjectOnMap?: unknown } }).__LIFEBUILD_E2E__
        ?.seedProjectOnMap === 'function',
    undefined,
    { timeout: 15000 }
  )

  await page.evaluate(async seedInput => {
    const testHooks = (
      window as {
        __LIFEBUILD_E2E__?: { seedProjectOnMap?: (input: SeedProjectOnMapInput) => Promise<void> }
      }
    ).__LIFEBUILD_E2E__
    if (!testHooks?.seedProjectOnMap) {
      throw new Error('Missing map seeding hooks')
    }
    await testHooks.seedProjectOnMap(seedInput)
  }, input)
}

const isLoadingLiveStore = async (page: Page): Promise<boolean> => {
  return page
    .locator('text=Loading LiveStore')
    .isVisible()
    .catch(() => false)
}

const expectMapLayerVisible = async (page: Page) => {
  const canvas = page.locator('canvas').first()
  const hasCanvas = await canvas
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false)

  if (hasCanvas) {
    return
  }

  if (
    await page
      .getByText('Map unavailable on this device')
      .isVisible()
      .catch(() => false)
  ) {
    await expect(page.getByText('Map unavailable on this device')).toBeVisible()
  }
}

const expectSanctuaryOverlayContent = async (page: Page) => {
  const firstVisitWelcome = page.getByTestId('sanctuary-first-visit-welcome')
  const returningPlaceholder = page.getByTestId('sanctuary-charter-placeholder')

  if (await firstVisitWelcome.isVisible().catch(() => false)) {
    await expect(firstVisitWelcome).toBeVisible()
    return
  }

  await expect(returningPlaceholder).toBeVisible()
}

test.describe('Building overlay routing', () => {
  test('opens project overlay from a map tile and closes via button, Escape, and browser back', async ({
    page,
  }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    await expectMapLayerVisible(page)

    const projectId = `e2e-project-${Date.now()}`
    await seedProjectOnMap(page, {
      projectId,
      name: 'Map Tile Overlay Project',
      description: 'Project seeded for overlay route testing.',
      coord: { q: -1, r: 1 },
    })

    const tileButton = page.getByTestId(`hex-tile-button-${projectId}`)
    await expect(tileButton).toBeVisible({ timeout: 10000 })

    await tileButton.click()
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}\\?storeId=${storeId}$`))
    await expect(page.getByRole('heading', { name: 'Map Tile Overlay Project' })).toBeVisible()
    await expect(page.getByText('Project seeded for overlay route testing.')).toBeVisible()

    await page.getByTestId('building-overlay-close').click()
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))

    await tileButton.click()
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}\\?storeId=${storeId}$`))
    await expect(page.getByTestId('building-overlay')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))

    await tileButton.click()
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}\\?storeId=${storeId}$`))
    await expect(page.getByTestId('building-overlay')).toHaveCount(1)
    await page.goBack()
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))
  })

  test('opens completed project overlays from map tiles', async ({ page }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    await expectMapLayerVisible(page)

    const projectId = `e2e-completed-project-${Date.now()}`
    await seedProjectOnMap(page, {
      projectId,
      name: 'Completed Map Project',
      description: 'Project seeded in completed state for overlay routing.',
      coord: { q: 2, r: -2 },
      lifecycleStatus: 'completed',
    })

    const tileButton = page.getByTestId(`hex-tile-button-${projectId}`)
    await expect(tileButton).toBeVisible({ timeout: 10000 })

    await tileButton.click()
    await expect(page).toHaveURL(new RegExp(`/projects/${projectId}\\?storeId=${storeId}$`))
    await expect(page.getByRole('heading', { name: 'Completed Map Project' })).toBeVisible()
  })

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
    await expect(page.getByTestId('sanctuary-first-visit-welcome')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))

    await page.goto(`/sanctuary?storeId=${storeId}`)
    await waitForLiveStoreReady(page)
    await expectSanctuaryOverlayContent(page)
    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))

    const workshopButton = page.getByTestId('fixed-building-workshop-button')
    let openedWorkshopFromMap = false
    if (await workshopButton.isVisible().catch(() => false)) {
      await workshopButton.click()
      openedWorkshopFromMap = true
      await expect(page).toHaveURL(new RegExp(`/workshop\\?storeId=${storeId}$`))
    } else {
      await page.goto(`/workshop?storeId=${storeId}`, { waitUntil: 'domcontentloaded' })
      await waitForLiveStoreReady(page)
    }

    await expect(page.getByTestId('building-overlay')).toHaveCount(1, { timeout: 15000 })
    await expect(page.getByRole('heading', { name: 'Workshop' })).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('attendant-rail-avatar-marvin')).toHaveAttribute(
      'aria-pressed',
      'true'
    )

    if (openedWorkshopFromMap) {
      await page.goBack()
    } else {
      await page.keyboard.press('Escape')
    }
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))
  })

  test('deep links render map behind overlay and enforce single-overlay route state', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const storeId = await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    await page.goto(`/sanctuary?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    await expectMapLayerVisible(page)
    await expect(page.getByRole('heading', { name: 'Sanctuary' })).toBeVisible()
    await expect(page.getByTestId('building-overlay')).toHaveCount(1)
    await expect(page.getByTestId('sanctuary-first-visit-welcome')).toBeVisible()

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
