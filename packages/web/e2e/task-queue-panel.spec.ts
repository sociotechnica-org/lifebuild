import { expect, test, type Page } from '@playwright/test'
import { navigateToAppWithUniqueStore } from './test-utils'

type SeedProjectOnMapInput = {
  projectId: string
  name: string
  description?: string
  coord: { q: number; r: number }
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
  if (await canvas.isVisible().catch(() => false)) {
    await expect(canvas).toBeVisible()
    return
  }

  await expect(page.getByText('Map unavailable on this device')).toBeVisible()
}

const addTaskFromProjectOverlay = async (
  page: Page,
  storeId: string,
  projectId: string,
  taskTitle: string
) => {
  const tileButton = page.getByTestId(`hex-tile-button-${projectId}`)
  await expect(tileButton).toBeVisible({ timeout: 10000 })

  await tileButton.click()
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}\\?storeId=${storeId}$`))

  const overlayPanel = page.getByTestId('building-overlay-panel')
  await overlayPanel.getByPlaceholder('Task name').fill(taskTitle)
  await overlayPanel.getByRole('button', { name: 'Add task' }).click()

  await expect(overlayPanel.getByText(taskTitle)).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))
}

test.describe('Task queue panel', () => {
  test('shows cross-project queue, cycles task state, and routes into project overlay', async ({
    page,
  }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    await expectMapLayerVisible(page)

    const firstProjectId = `task-queue-a-${Date.now()}`
    const secondProjectId = `task-queue-b-${Date.now()}`

    await seedProjectOnMap(page, {
      projectId: firstProjectId,
      name: 'Task Queue Project A',
      description: 'Queue E2E project A',
      coord: { q: -1, r: 1 },
    })

    await seedProjectOnMap(page, {
      projectId: secondProjectId,
      name: 'Task Queue Project B',
      description: 'Queue E2E project B',
      coord: { q: 2, r: -1 },
    })

    const firstTaskTitle = 'Queue task A'
    const secondTaskTitle = 'Queue task B'

    await addTaskFromProjectOverlay(page, storeId, firstProjectId, firstTaskTitle)
    await addTaskFromProjectOverlay(page, storeId, secondProjectId, secondTaskTitle)

    const queuePanel = page.getByTestId('task-queue-panel')
    await expect(queuePanel).toBeVisible()
    await expect(queuePanel.getByText('Task Queue Project A')).toBeVisible()
    await expect(queuePanel.getByText('Task Queue Project B')).toBeVisible()

    const cycleButton = queuePanel.getByRole('button', {
      name: `Cycle status for ${firstTaskTitle}`,
    })
    await expect(cycleButton).toHaveText('[ ]')

    await cycleButton.click()

    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))
    await expect(cycleButton).toHaveText('[i]')

    await queuePanel.getByText(firstTaskTitle).click()

    await expect(page).toHaveURL(new RegExp(`/projects/${firstProjectId}\\?storeId=${storeId}$`))
    await expect(page.getByTestId('building-overlay')).toHaveCount(1)
    await expect(queuePanel).toBeVisible()
  })
})
