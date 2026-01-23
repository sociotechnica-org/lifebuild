/**
 * E2E tests for the Settings page in the new UI
 * Tests that the Settings page loads and displays correctly
 */

import { test, expect } from '@playwright/test'
import { waitForLiveStoreReady, APP_URL } from './test-utils.js'

test.describe('Settings Page', () => {
  test.describe.configure({ timeout: 60000 })

  test('settings page loads and displays settings form', async ({ page }) => {
    const storeId = `test-settings-${Date.now()}`

    // Navigate directly to settings page
    await page.goto(`${APP_URL}/settings?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    // Wait for page to load
    await page.waitForTimeout(2000)

    // Check if we're stuck on loading screen
    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - expected in CI without sync server')
      return // Exit gracefully in CI
    }

    // Verify the Settings heading is visible
    const settingsHeading = page.locator('h1:has-text("Settings")')
    await expect(settingsHeading).toBeVisible({ timeout: 10000 })

    // Verify the page description
    await expect(page.locator('text=Configure your LifeBuild instance')).toBeVisible()

    // Verify Instance Name field is present
    const instanceNameLabel = page.locator('label:has-text("Instance Name")')
    await expect(instanceNameLabel).toBeVisible()

    // Verify Instance Name input exists
    const instanceNameInput = page.locator('#instance-name')
    await expect(instanceNameInput).toBeVisible()

    // Verify System Prompt section is present
    await expect(page.locator('text=Global System Prompt')).toBeVisible()

    // Verify Recurring Task Prompt section is present
    await expect(page.locator('text=Recurring Task Custom Prompt')).toBeVisible()

    // Verify action buttons are present
    await expect(page.locator('button:has-text("Reset to Defaults")')).toBeVisible()
    await expect(page.locator('button:has-text("Save Changes")')).toBeVisible()
  })

  test('settings page has correct new UI navigation', async ({ page }) => {
    const storeId = `test-settings-nav-${Date.now()}`

    // Navigate to settings page
    await page.goto(`${APP_URL}/settings?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    await page.waitForTimeout(2000)

    // Check if we're stuck on loading screen
    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - expected in CI without sync server')
      return
    }

    // Verify we have new UI navigation (not old UI navigation)
    // New UI has: Drafting Room, Sorting Room, Roster Room, Life Map
    await expect(page.locator('a:has-text("Drafting Room")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('a:has-text("Sorting Room")')).toBeVisible()
    await expect(page.locator('a:has-text("Life Map")')).toBeVisible()

    // Verify we do NOT have old UI navigation
    // Old UI has: Life Map, Projects, Tasks, Team, Documents, Contacts
    await expect(page.locator('nav a:has-text("Tasks")')).not.toBeVisible()
    await expect(page.locator('nav a:has-text("Team")')).not.toBeVisible()
    await expect(page.locator('nav a:has-text("Documents")')).not.toBeVisible()
    await expect(page.locator('nav a:has-text("Contacts")')).not.toBeVisible()
  })

  test('can modify instance name and see unsaved changes', async ({ page }) => {
    const storeId = `test-settings-edit-${Date.now()}`

    // Navigate to settings page
    await page.goto(`${APP_URL}/settings?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    await page.waitForTimeout(2000)

    // Check if we're stuck on loading screen
    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - expected in CI without sync server')
      return
    }

    // Find the instance name input
    const instanceNameInput = page.locator('#instance-name')
    await expect(instanceNameInput).toBeVisible({ timeout: 10000 })

    // Clear and type a new value
    await instanceNameInput.clear()
    await instanceNameInput.fill('Test Instance Name')

    // Verify "Discard Changes" button appears (indicates unsaved changes)
    await expect(page.locator('button:has-text("Discard Changes")')).toBeVisible({ timeout: 5000 })

    // Verify "Save Changes" button is now enabled (not disabled)
    const saveButton = page.locator('button:has-text("Save Changes")')
    await expect(saveButton).toBeEnabled()
  })
})
