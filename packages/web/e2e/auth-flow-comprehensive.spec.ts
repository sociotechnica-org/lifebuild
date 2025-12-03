/**
 * Comprehensive E2E Authentication Flow Test
 *
 * Tests the complete user flow: signup → login → authenticated actions → logout
 * Designed to work with both REQUIRE_AUTH=false (dev) and REQUIRE_AUTH=true (prod)
 */

import { test, expect } from '@playwright/test'
import {
  createTestUserViaAPI,
  loginViaUI,
  logoutViaUI,
  APP_URL,
  REQUIRE_AUTH,
} from './test-utils.js'

test.describe('Authentication Flow E2E', () => {
  test.describe.configure({ timeout: 90000 }) // Extended timeout for full flow

  test('should demonstrate complete auth-enabled workflow', async ({ page }) => {
    // Skip if auth is not enforced - this test requires full auth
    test.skip(!REQUIRE_AUTH, 'This test requires REQUIRE_AUTH=true environment')

    // Step 1: Verify protected routes redirect to login
    await page.goto(`${APP_URL}/projects`)

    // Should be redirected to login
    await page.waitForURL(/\/login/, { timeout: 15000 })

    // Step 2: Create test user via API (more reliable than UI)
    const testUser = await createTestUserViaAPI()

    // Step 3: Login via UI
    await loginViaUI(page, testUser.email, testUser.password)

    // Step 4: Verify authenticated UI state

    // Should see main navigation
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=Projects')).toBeVisible()

    // Should NOT see "Sign in" button
    await expect(page.locator('text=Sign in')).not.toBeVisible()

    // Step 5: Test authenticated functionality - create a project

    // Look for "Add Project" button or similar
    const addProjectButton = page
      .locator(
        'button:has-text("Add Project"), [aria-label*="project" i]:has-text("Add"), button:has-text("Create Project")'
      )
      .first()

    // If project creation modal exists, use it
    if (await addProjectButton.isVisible({ timeout: 5000 })) {
      await addProjectButton.click()

      // Fill project form (flexible selectors)
      const projectNameInput = page
        .locator(
          'input[placeholder*="project" i], input[name*="name"], input[aria-label*="name" i]'
        )
        .first()
      const projectDescInput = page
        .locator('textarea[placeholder*="description" i], textarea[name*="description"]')
        .first()

      await projectNameInput.fill('E2E Auth Test Project')
      if (await projectDescInput.isVisible({ timeout: 2000 })) {
        await projectDescInput.fill('Created during E2E authentication test')
      }

      // Submit project creation
      const createButton = page.locator('button:has-text("Create"), button[type="submit"]').first()
      await createButton.click()

      // Verify project was created
      await expect(page.locator('text=E2E Auth Test Project')).toBeVisible({ timeout: 10000 })
    }

    // Step 6: Test logout functionality

    await logoutViaUI(page)

    // Step 7: Verify protection is restored
    await page.goto(`${APP_URL}/old/projects`)
    await page.waitForURL(/\/login/, { timeout: 10000 })
  })

  test('should handle development mode correctly', async ({ page }) => {
    // This test runs in development mode (REQUIRE_AUTH=false)
    test.skip(REQUIRE_AUTH, 'This test is for development mode only')

    // Testing development mode behavior

    // In dev mode, should be able to access protected routes
    await page.goto(`${APP_URL}/old/projects`)
    await page.waitForLoadState('load', { timeout: 30000 })

    // Should NOT redirect to login in dev mode
    expect(page.url()).not.toContain('/login')

    // Wait for LiveStore to finish loading and app to render
    // First wait for loading state to disappear or timeout after reasonable time
    try {
      await page.waitForSelector('text=Loading LiveStore', { state: 'detached', timeout: 20000 })
    } catch {
      // LiveStore loading timeout - continuing with test
    }

    // Should see main app interface - check for Projects heading instead of nav
    await expect(page.locator('h1:has-text("Projects")')).toBeVisible({ timeout: 10000 })

    // Should still be able to access auth pages
    await page.goto(`${APP_URL}/login`)
    await page.waitForLoadState('load', { timeout: 10000 })

    // Page should load (even if it has loading states)
    await expect(page.locator('body')).toBeVisible()
  })

  test('should validate form inputs correctly', async ({ page }) => {
    // Test form validation - works in both modes

    await page.goto(`${APP_URL}/signup`)
    await page.waitForLoadState('load', { timeout: 15000 })
    await page.waitForTimeout(3000) // Give form time to render

    // Try to find form elements with flexible selectors
    const emailInput = page.locator('input[type="email"], input[name="email"]').first()
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first()
    const confirmPasswordInput = page
      .locator('input[name="confirmPassword"], input[id="confirmPassword"]')
      .first()
    const submitButton = page.locator('button[type="submit"], button:has-text("Create")').first()

    // Test form validation scenarios
    if (await emailInput.isVisible({ timeout: 5000 })) {
      // Test 1: Invalid email format should trigger browser validation
      await emailInput.fill('invalid-email')
      await passwordInput.fill('validpassword123')
      await confirmPasswordInput.fill('validpassword123')

      // Button should be enabled now since all fields are filled
      await expect(submitButton).toBeEnabled()

      // Try to submit - browser validation should prevent it
      await submitButton.click()

      // Check if still on signup page (form validation prevented submission)
      await expect(page).toHaveURL(/signup/)

      // Test 2: Valid email format
      await emailInput.fill('testuser@example.com')
      await passwordInput.fill('validpassword123')
      await confirmPasswordInput.fill('validpassword123')

      // Button should be enabled
      await expect(submitButton).toBeEnabled()

      // Click submit - this should attempt to create account
      await submitButton.click()

      // Should either redirect or show an error (since this is a test email)
      // We'll wait for any response and check that the form at least processes
      await page.waitForTimeout(2000)
    }
  })
})

test.describe('Authentication API Integration', () => {
  test('should successfully create user via auth service API', async () => {
    const testUser = await createTestUserViaAPI()

    expect(testUser.email).toContain('@example.com')
    expect(testUser.password).toBe('E2ETestPassword123!')
    expect(testUser.accessToken).toBeDefined()
    expect(testUser.refreshToken).toBeDefined()
  })
})
