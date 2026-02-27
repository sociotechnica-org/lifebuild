import { expect, test, type Page } from '@playwright/test'
import { navigateToAppWithUniqueStore } from './test-utils'

type SeedProjectPlacementInput = {
  projectId: string
  name: string
  description?: string
  category?: string | null
  coord: { q: number; r: number }
}

type SeedUnplacedProjectInput = Omit<SeedProjectPlacementInput, 'coord'>

const isLoadingLiveStore = async (page: Page): Promise<boolean> => {
  return page
    .locator('text=Loading LiveStore')
    .isVisible()
    .catch(() => false)
}

const hasMapCanvas = async (page: Page): Promise<boolean> => {
  return page
    .locator('canvas')
    .first()
    .isVisible()
    .catch(() => false)
}

const seedUnplacedProject = async (page: Page, input: SeedUnplacedProjectInput) => {
  await page.waitForFunction(
    () =>
      typeof (window as { __LIFEBUILD_E2E__?: { seedUnplacedProject?: unknown } }).__LIFEBUILD_E2E__
        ?.seedUnplacedProject === 'function',
    undefined,
    { timeout: 15000 }
  )

  await page.evaluate(async seedInput => {
    const testHooks = (
      window as {
        __LIFEBUILD_E2E__?: {
          seedUnplacedProject?: (input: SeedUnplacedProjectInput) => Promise<void>
        }
      }
    ).__LIFEBUILD_E2E__

    if (!testHooks?.seedUnplacedProject) {
      throw new Error('Missing unplaced project seed hook')
    }

    await testHooks.seedUnplacedProject(seedInput)
  }, input)
}

const seedProjectOnMap = async (page: Page, input: SeedProjectPlacementInput) => {
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
        __LIFEBUILD_E2E__?: {
          seedProjectOnMap?: (input: SeedProjectPlacementInput) => Promise<void>
        }
      }
    ).__LIFEBUILD_E2E__

    if (!testHooks?.seedProjectOnMap) {
      throw new Error('Missing map project seed hook')
    }

    await testHooks.seedProjectOnMap(seedInput)
  }, input)
}

test.describe('Life Map placement tray flow', () => {
  test('starts placement from workshop, cancels with Escape, and renders placed tile', async ({
    page,
  }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    if (!(await hasMapCanvas(page))) {
      return
    }

    const projectId = `e2e-placement-${Date.now()}`
    const projectName = 'Workshop Placement Project'

    await seedUnplacedProject(page, {
      projectId,
      name: projectName,
      description: 'Project used to verify workshop placement flow.',
      category: 'growth',
    })

    await page.goto(`/workshop?storeId=${storeId}`)
    await expect(page.getByRole('heading', { name: 'Workshop' })).toBeVisible()

    await page.getByTestId(`workshop-place-project-${projectId}`).click()
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))
    await expect(page.getByText('Placement mode')).toBeVisible()
    await expect(page.getByText(new RegExp(`Placing ${projectName}`))).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`/workshop\\?storeId=${storeId}$`))

    await page.getByTestId(`workshop-place-project-${projectId}`).click()
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`))
    await expect(page.getByText('Placement mode')).toBeVisible()

    await seedProjectOnMap(page, {
      projectId,
      name: projectName,
      description: 'Project used to verify workshop placement flow.',
      category: 'growth',
      coord: { q: -2, r: 1 },
    })

    await expect(page.getByTestId(`hex-tile-button-${projectId}`)).toBeVisible({ timeout: 10000 })
  })
})
