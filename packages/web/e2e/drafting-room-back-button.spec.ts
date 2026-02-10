import { test, expect, Page } from '@playwright/test'
import { waitForLiveStoreReady, createTestUserViaAPI, loginViaUI } from './test-utils.js'

const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true'

/**
 * Helper to navigate to the app with a unique store ID
 */
async function navigateWithUniqueStore(page: Page) {
  const storeId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`

  if (REQUIRE_AUTH) {
    const testUser = await createTestUserViaAPI()
    await page.goto(`/login?storeId=${storeId}`)
    await loginViaUI(page, testUser.email, testUser.password, { skipNavigation: true })
    await page.waitForLoadState('networkidle', { timeout: 15000 })
  }

  return storeId
}

test.describe('Drafting Room - Browser Back Button', () => {
  test.describe.configure({ timeout: 60000 }) // 1 minute timeout

  test('should not create duplicate project when using back button to change title', async ({
    page,
  }) => {
    const storeId = await navigateWithUniqueStore(page)
    const initialTitle = `Initial Project ${Date.now()}`
    const updatedTitle = `Updated Project ${Date.now()}`

    // =====================
    // STAGE 1: Create project with initial title
    // =====================

    await page.goto(`/drafting-room/new?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    await expect(page.getByText('Stage 1: Identify')).toBeVisible({ timeout: 10000 })

    // Fill in initial project title
    const titleInput = page.locator('input[placeholder*="project called"]')
    await titleInput.fill(initialTitle)
    await titleInput.blur()

    // Select category
    const healthButton = page.getByRole('button', { name: 'Health' })
    await healthButton.click()

    // Wait for auto-save and URL update
    // After the fix, the URL should change from /drafting-room/new to /drafting-room/{projectId}/stage1
    await page.waitForTimeout(1000)

    // Verify the URL now contains a project ID
    const urlAfterSave = page.url()
    expect(urlAfterSave).toMatch(/\/drafting-room\/[a-f0-9-]+\/stage1/)

    // Continue to Stage 2
    const continueButton = page.getByRole('button', { name: 'Continue to Stage 2' })
    await expect(continueButton).toBeEnabled()
    await continueButton.click()

    // =====================
    // STAGE 2: Verify we're on Stage 2
    // =====================

    await expect(page.getByText('Stage 2: Scope')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(initialTitle)).toBeVisible()

    // =====================
    // USE BROWSER BACK BUTTON to go back to Stage 1
    // =====================

    await page.goBack()

    // =====================
    // STAGE 1: Change the title
    // =====================

    await expect(page.getByText('Stage 1: Identify')).toBeVisible({ timeout: 10000 })

    // Wait for LiveStore to load the project data
    await page.waitForTimeout(500)

    // After the fix, the URL should still have the project ID
    const urlAfterBack = page.url()
    expect(urlAfterBack).toMatch(/\/drafting-room\/[a-f0-9-]+\/stage1/)

    // After the fix, the title should be preserved (loaded from the project)
    await expect(titleInput).toHaveValue(initialTitle)

    // Change the title
    await titleInput.fill(updatedTitle)
    await titleInput.blur()

    // Wait for auto-save
    await page.waitForTimeout(500)

    // Continue to Stage 2 again
    const continueButton2 = page.getByRole('button', { name: 'Continue to Stage 2' })
    await expect(continueButton2).toBeEnabled()
    await continueButton2.click()

    // =====================
    // STAGE 2: Verify updated title shows (not both titles)
    // =====================

    await expect(page.getByText('Stage 2: Scope')).toBeVisible({ timeout: 10000 })

    // Should show the updated title
    await expect(page.getByText(updatedTitle)).toBeVisible()

    // Should NOT show the initial title
    await expect(page.getByText(initialTitle)).not.toBeVisible()

    // Fill in objectives to complete Stage 2
    const objectivesTextarea = page.locator('textarea[placeholder*="specific outcomes"]')
    await objectivesTextarea.fill('Test objectives')
    await objectivesTextarea.blur()

    // Select project type (Initiative = Gold tier)
    const initiativeButton = page.getByRole('button', { name: /^Initiative/ })
    await initiativeButton.click()

    await page.waitForTimeout(500)

    // Continue to Stage 3
    const continueToStage3Button = page.getByRole('button', { name: 'Continue to Stage 3' })
    await continueToStage3Button.click()

    // =====================
    // STAGE 3: Verify we only have ONE project with the updated title
    // =====================

    await expect(page.getByText('Stage 3: Detail')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(updatedTitle)).toBeVisible()

    // Exit to Drafting Room to verify only one project exists
    const exitButton = page.getByRole('button', { name: 'Exit' })
    await exitButton.click()

    await expect(page.getByText(/Stage 1 ·/)).toBeVisible({ timeout: 10000 })

    // VERIFICATION: After the fix, we should only see ONE project with the updated title
    // and NO project with the initial title

    // Count project cards with the initial title
    const initialTitleElements = page.getByText(initialTitle, { exact: false })
    const initialTitleCount = await initialTitleElements.count()

    // Count project cards with the updated title
    const updatedTitleElements = page.getByText(updatedTitle, { exact: false })
    const updatedTitleCount = await updatedTitleElements.count()

    // After the fix, we should only see ONE project with the updated title
    expect(initialTitleCount).toBe(0) // Fixed: initial project no longer exists
    expect(updatedTitleCount).toBeGreaterThan(0) // Fixed: only the updated project exists
  })
})
