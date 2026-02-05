import { test, expect, Page } from '@playwright/test'
import { waitForLiveStoreReady, createTestUserViaAPI, loginViaUI } from './test-utils.js'

const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true'

/**
 * Helper to navigate to new UI with unique store ID
 */
async function navigateToNewUiWithUniqueStore(page: Page) {
  const storeId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`

  if (REQUIRE_AUTH) {
    const testUser = await createTestUserViaAPI()
    await page.goto(`/login?storeId=${storeId}`)
    await loginViaUI(page, testUser.email, testUser.password, { skipNavigation: true })
    await page.waitForLoadState('networkidle', { timeout: 15000 })
  }

  return storeId
}

/**
 * Helper to create a project through the drafting room and add to sorting
 */
async function createProjectAndAddToSorting(page: Page, storeId: string, projectName: string) {
  // Navigate to create new project
  await page.goto(`/drafting-room/new?storeId=${storeId}`)
  await waitForLiveStoreReady(page)

  // Wait for Stage 1 form to load
  await expect(page.getByText('Stage 1: Identify')).toBeVisible({ timeout: 10000 })

  // Fill in project title
  const titleInput = page.locator('input[placeholder*="project called"]')
  await titleInput.fill(projectName)
  await titleInput.blur()

  // Fill in description
  const descriptionTextarea = page.locator('textarea[placeholder*="1-2 sentences"]')
  await descriptionTextarea.fill('Test project for backlog select')
  await descriptionTextarea.blur()

  // Select category
  const categoryButton = page.getByRole('button', { name: 'Growth' })
  await categoryButton.click()

  await page.waitForTimeout(500)

  // Continue to Stage 2
  const continueToStage2Button = page.getByRole('button', { name: 'Continue to Stage 2' })
  await expect(continueToStage2Button).toBeEnabled()
  await continueToStage2Button.click()

  // Stage 2: Scope
  await expect(page.getByText('Stage 2: Scope')).toBeVisible({ timeout: 10000 })

  // Fill in objectives
  const objectivesTextarea = page.locator('textarea[placeholder*="specific outcomes"]')
  await objectivesTextarea.fill('Test objectives')
  await objectivesTextarea.blur()

  // Select project type (Initiative = Gold tier)
  const initiativeButton = page.getByRole('button', { name: /^Initiative/ })
  await initiativeButton.click()

  await page.waitForTimeout(500)

  // Continue to Stage 3
  const continueToStage3Button = page.getByRole('button', { name: 'Continue to Stage 3' })
  await expect(continueToStage3Button).toBeEnabled()
  await continueToStage3Button.click()

  // Stage 3: Detail
  await expect(page.getByText('Stage 3: Detail')).toBeVisible({ timeout: 10000 })

  // Add to Sorting (this moves it to backlog)
  const addToSortingButton = page.getByRole('button', { name: 'Add to Sorting' })
  await expect(addToSortingButton).toBeEnabled()
  await addToSortingButton.click()

  // Wait for Sorting Room to load
  await expect(page.getByRole('heading', { name: 'Initiative' })).toBeVisible({ timeout: 10000 })
}

test.describe('Table Slot Backlog Selection', () => {
  test.describe.configure({ timeout: 120000 }) // 2 minute timeout

  test('clicking empty Gold slot shows popover above the slot with backlog projects', async ({
    page,
  }) => {
    const storeId = await navigateToNewUiWithUniqueStore(page)
    const projectName = `Backlog Test ${Date.now()}`

    // Create a project and add it to sorting (backlog)
    await createProjectAndAddToSorting(page, storeId, projectName)

    // Navigate to Life Map to see the TableBar at the bottom
    await page.goto(`/life-map?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    // Wait for the TableBar to be visible
    const tableBar = page.locator('.bg-white\\/95.border-t')
    await expect(tableBar).toBeVisible({ timeout: 10000 })

    // Find the Initiative slot (Gold) - it should say "Click to add"
    const goldSlot = page.locator('button').filter({ hasText: 'Initiative' }).first()
    await expect(goldSlot).toBeVisible()
    await expect(goldSlot.getByText('Click to add')).toBeVisible()

    // Click the empty Gold slot
    await goldSlot.click()

    // Wait for the popover to appear
    const popover = page.locator('[data-testid="backlog-select-popover"]')
    await expect(popover).toBeVisible({ timeout: 5000 })

    // Verify the popover header is correct
    await expect(popover.getByText('Add Initiative from Backlog')).toBeVisible()

    // CRITICAL: Verify the popover is visible within the viewport (not cut off)
    const popoverBox = await popover.boundingBox()
    expect(popoverBox).not.toBeNull()

    // The popover should be above the slot, so its bottom should be above the slot's top
    // and it should be fully visible in the viewport
    const viewportSize = page.viewportSize()
    expect(viewportSize).not.toBeNull()

    // Popover should be fully within the viewport
    expect(popoverBox!.y).toBeGreaterThanOrEqual(0) // Top edge should be at or below viewport top
    expect(popoverBox!.y + popoverBox!.height).toBeLessThanOrEqual(viewportSize!.height) // Bottom edge should be within viewport

    // Verify our project is listed in the popover
    await expect(popover.getByText(projectName)).toBeVisible()

    // Click the project to select it
    await popover.getByText(projectName).click()

    // Popover should close
    await expect(popover).not.toBeVisible({ timeout: 5000 })

    // The Gold slot should now show the project name (not "Click to add")
    await expect(goldSlot.getByText('Click to add')).not.toBeVisible({ timeout: 5000 })
    await expect(page.getByText(projectName)).toBeVisible()
  })

  test('popover closes when pressing Escape', async ({ page }) => {
    const storeId = await navigateToNewUiWithUniqueStore(page)
    const projectName = `Escape Test ${Date.now()}`

    await createProjectAndAddToSorting(page, storeId, projectName)

    await page.goto(`/life-map?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    // Click the empty Gold slot
    const goldSlot = page.locator('button').filter({ hasText: 'Initiative' }).first()
    await goldSlot.click()

    // Verify popover is open
    const popover = page.locator('[data-testid="backlog-select-popover"]')
    await expect(popover).toBeVisible({ timeout: 5000 })

    // Press Escape
    await page.keyboard.press('Escape')

    // Popover should close
    await expect(popover).not.toBeVisible({ timeout: 5000 })
  })

  test('popover shows empty state with link to Drafting Room when no backlog projects', async ({
    page,
  }) => {
    const storeId = await navigateToNewUiWithUniqueStore(page)

    // Navigate directly to Life Map without creating any projects
    await page.goto(`/life-map?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    // Click the empty Gold slot
    const goldSlot = page.locator('button').filter({ hasText: 'Initiative' }).first()

    // The slot might not be clickable if there's no backlog items AND no handler
    // But with our implementation, it should still show "Click to add" and be interactive
    if (await goldSlot.getByText('Click to add').isVisible({ timeout: 3000 })) {
      await goldSlot.click()

      // Verify popover shows empty state
      const popover = page.locator('[data-testid="backlog-select-popover"]')
      await expect(popover).toBeVisible({ timeout: 5000 })
      await expect(popover.getByText('No projects available')).toBeVisible()
      await expect(popover.getByText('Create new project')).toBeVisible()

      // The "Create new project" link should navigate to drafting room
      const createLink = popover.getByRole('link', { name: 'Create new project' })
      await expect(createLink).toHaveAttribute('href', /\/drafting-room\/new/)
    }
  })
})
