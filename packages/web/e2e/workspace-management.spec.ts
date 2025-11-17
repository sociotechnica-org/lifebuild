import { test, expect } from '@playwright/test'

test.describe('Workspace Management', () => {
  test.beforeEach(async ({ page }) => {
    // Skip the entire suite in CI - workspace switcher only shows when authenticated
    if (process.env.CI) {
      return
    }

    // Navigate to the app
    await page.goto('/', { waitUntil: 'domcontentloaded' })

    // Wait for the app to be interactive
    await page.waitForSelector('text=Life Map', { timeout: 15000 })
  })

  test.skip(
    !!process.env.CI,
    'workspace rename persists after browser reload',
    async ({ page }) => {
      // Find and click the workspace switcher button
      const workspaceSwitcher = page.getByTestId('workspace-switcher-button')
      await expect(workspaceSwitcher).toBeVisible({ timeout: 10000 })

      // Click to open the dropdown
      await workspaceSwitcher.click()

      // Wait for dropdown to appear
      await expect(page.locator('text=Workspaces')).toBeVisible({ timeout: 10000 })

      // Find the rename button for the current workspace
      const renameButton = page.locator('[aria-label*="Rename"]').first()
      await expect(renameButton).toBeVisible()

      // Click rename button
      await renameButton.click()

      // Wait for the input field to appear
      const nameInput = page.locator('input[type="text"]').first()
      await expect(nameInput).toBeVisible()

      // Change the name to something unique
      const newWorkspaceName = `Test WS ${Date.now()}`
      await nameInput.fill(newWorkspaceName)

      // Press Enter to save
      await nameInput.press('Enter')

      // Wait for the save to complete
      await page.waitForTimeout(2000)

      // Now reload the page
      await page.reload({ waitUntil: 'domcontentloaded' })

      // Wait for the page to be fully loaded again
      await expect(page.locator('text=Life Map')).toBeVisible({ timeout: 15000 })

      // Find the workspace switcher again
      const workspaceSwitcherAfterReload = page.getByTestId('workspace-switcher-button')
      await expect(workspaceSwitcherAfterReload).toBeVisible({ timeout: 10000 })

      // The workspace name should still be the new name
      await expect(workspaceSwitcherAfterReload).toContainText(newWorkspaceName, { timeout: 10000 })

      console.log('Test passed: Workspace name persisted after reload')
    }
  )
})
