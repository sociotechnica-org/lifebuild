import { expect, test, type Page } from '@playwright/test'
import { navigateToAppWithUniqueStore } from './test-utils'

type SeedUnplacedProjectInput = {
  projectId: string
  name: string
  description?: string
  category?: string | null
}

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

test.describe('Life Map placement tray flow', () => {
  test('starts placement from workshop and cancels with Escape', async ({ page }) => {
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

    await page.getByTestId(`workshop-place-project-${projectId}`).click({ noWaitAfter: true })
    await expect(page).toHaveURL(new RegExp(`/\\?storeId=${storeId}$`), { timeout: 15000 })
    await expect(page.getByTestId('building-overlay')).toHaveCount(0)

    await page.keyboard.press('Escape')
    await expect(page).toHaveURL(new RegExp(`/workshop\\?storeId=${storeId}$`), {
      timeout: 15000,
    })
    await expect(page.getByRole('heading', { name: 'Workshop' })).toBeVisible()
  })
})
