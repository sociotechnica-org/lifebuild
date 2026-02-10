/**
 * E2E tests for the new UI shell user dropdown menu
 * Tests login and logout functionality via the user initials dropdown
 */

import { test, expect } from '@playwright/test'
import { createTestUserViaAPI, APP_URL, REQUIRE_AUTH, loginViaUI } from './test-utils.js'

test.describe('New UI Shell User Dropdown', () => {
  test.describe.configure({ timeout: 60000 })

  test('should login and logout via user dropdown menu in new UI', async ({ page }) => {
    // Skip this test if auth is not required (development mode)
    test.skip(!REQUIRE_AUTH, 'This test requires REQUIRE_AUTH=true environment')

    // Create a test user
    const testUser = await createTestUserViaAPI()

    // Navigate to new UI route (drafting-room uses NewUiShell)
    await page.goto(`${APP_URL}/drafting-room`)

    // Should redirect to login since auth is required
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // Login with the test user
    await loginViaUI(page, testUser.email, testUser.password, { skipNavigation: true })

    // After login, navigate to the new UI
    await page.goto(`${APP_URL}/drafting-room`)
    await page.waitForLoadState('load')
    await page.waitForTimeout(2000) // Allow time for app to initialize

    // Verify we're on the drafting room page
    await expect(page).toHaveURL(/\/drafting-room/)

    // Find and click the user menu button (the initials button)
    const userMenuButton = page.locator('[data-testid="user-menu-button"]')
    await expect(userMenuButton).toBeVisible({ timeout: 10000 })
    await userMenuButton.click()

    // Verify dropdown menu is visible with expected options
    await expect(page.locator('text=Sign out')).toBeVisible({ timeout: 5000 })

    // Click Sign out
    await page.locator('button:has-text("Sign out")').click()

    // Should redirect to login page
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // Verify we're on the login page
    await expect(page.locator('h2')).toContainText('Sign in to your account')

    // Verify we cannot access protected new UI routes
    await page.goto(`${APP_URL}/drafting-room`)
    await page.waitForURL(/\/login/, { timeout: 10000 })
  })

  test('should redirect to login when not authenticated in new UI', async ({ page }) => {
    // Skip this test if auth is not required
    test.skip(!REQUIRE_AUTH, 'This test requires REQUIRE_AUTH=true environment')

    // Clear any existing auth state
    await page.goto(`${APP_URL}/login`)
    await page.evaluate(() => {
      localStorage.removeItem('lifebuild-access-token')
      localStorage.removeItem('lifebuild-refresh-token')
      localStorage.removeItem('lifebuild-user-info')
    })

    // Navigate to a new UI route (drafting-room uses NewUiShell)
    await page.goto(`${APP_URL}/drafting-room`)

    // Should redirect to login since not authenticated
    await page.waitForURL(/\/login/, { timeout: 10000 })

    // Verify we're on the login page
    await expect(page.locator('h2')).toContainText('Sign in to your account')
  })

  test('should not show admin link for non-admin users', async ({ page }) => {
    // Skip this test if auth is not required
    test.skip(!REQUIRE_AUTH, 'This test requires REQUIRE_AUTH=true environment')

    // Create and login with a test user
    const testUser = await createTestUserViaAPI()

    await page.goto(`${APP_URL}/login`)
    await loginViaUI(page, testUser.email, testUser.password, { skipNavigation: true })

    // Navigate to new UI
    await page.goto(`${APP_URL}/drafting-room`)
    await page.waitForLoadState('load')
    await page.waitForTimeout(2000)

    // Open user dropdown
    const userMenuButton = page.locator('[data-testid="user-menu-button"]')
    await expect(userMenuButton).toBeVisible({ timeout: 10000 })
    await userMenuButton.click()

    await expect(page.locator('text=Admin')).toHaveCount(0)
  })
})
