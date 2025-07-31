/**
 * E2E tests for authentication integration
 * Tests the complete user flow from login to event creation with metadata
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || 'https://work-squared-auth.jessmartin.workers.dev'
const APP_URL = process.env.APP_URL || 'http://localhost:5173'
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true'

/**
 * Helper to create a test user via API
 */
async function createTestUser() {
  const testEmail = `e2e-test-${Date.now()}@example.com`
  const testPassword = 'E2ETestPassword123!'

  const response = await fetch(`${AUTH_SERVICE_URL}/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: testPassword }),
  })

  if (!response.ok) {
    throw new Error(`Failed to create test user: ${response.status}`)
  }

  const data = await response.json()
  if (!data.success) {
    throw new Error(`Test user creation failed: ${data.error?.message}`)
  }

  return {
    email: testEmail,
    password: testPassword,
    user: data.user,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  }
}

/**
 * Helper to inject auth tokens into browser
 */
async function injectAuthTokens(page: Page, accessToken: string, refreshToken: string, user: any) {
  await page.addInitScript(
    ({ accessToken, refreshToken, user }) => {
      localStorage.setItem('work-squared-access-token', accessToken)
      localStorage.setItem('work-squared-refresh-token', refreshToken)
      localStorage.setItem('work-squared-user-info', JSON.stringify(user))
    },
    { accessToken, refreshToken, user }
  )
}

test.describe('Authentication Integration E2E', () => {
  test.describe.configure({ timeout: 60000 }) // 60 second timeout for auth tests

  test('should complete full authentication flow: signup → login → create project', async ({ page }) => {
    // Skip this test if auth is not required (development mode)
    test.skip(!REQUIRE_AUTH, 'This test requires REQUIRE_AUTH=true environment')
    
    // This test validates the complete authentication flow when auth is enforced

    // 1. Try to access protected route - should redirect to login
    await page.goto(`${APP_URL}/projects`)
    await page.waitForURL(/\/login/, { timeout: 10000 })
    
    // Should see login page
    await expect(page.locator('h1')).toContainText('Work Squared')
    await expect(page.locator('h2')).toContainText('Sign in to your account')

    // 2. Navigate to signup page
    await page.click('text=Sign up')
    await page.waitForURL(/\/signup/, { timeout: 5000 })
    
    // Should see signup page
    await expect(page.locator('h2')).toContainText('Create your account')

    // 3. Fill out signup form
    const testEmail = `e2e-test-${Date.now()}@example.com`
    const testPassword = 'E2ETestPassword123!'
    
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.fill('input[name="confirmPassword"]', testPassword)
    
    // Submit signup form
    await page.click('button[type="submit"]')
    
    // Should redirect to login with success message
    await page.waitForURL(/\/login/, { timeout: 10000 })
    await expect(page.locator('text=Account created successfully')).toBeVisible()

    // 4. Login with the new account
    await page.fill('input[name="email"]', testEmail)
    await page.fill('input[name="password"]', testPassword)
    await page.click('button[type="submit"]')

    // Should redirect to projects page after successful login
    await page.waitForURL(/\/projects/, { timeout: 10000 })
    
    // Should see the main app interface
    await expect(page.locator('nav')).toBeVisible()
    await expect(page.locator('text=Projects')).toBeVisible()

    // 5. Verify authenticated state in header
    // Should see user initials dropdown, not "Sign in" button
    const userDropdown = page.locator('[title*="@"]') // User email in title
    await expect(userDropdown).toBeVisible()
    
    // Should not see "Sign in" button
    await expect(page.locator('text=Sign in')).not.toBeVisible()

    // 6. Create a project to test authenticated functionality
    await page.click('text=Add Project')
    await page.fill('input[placeholder*="project name"]', 'E2E Test Project')
    await page.fill('textarea[placeholder*="description"]', 'Created by E2E auth test')
    await page.click('button:has-text("Create Project")')

    // Should see the new project
    await expect(page.locator('text=E2E Test Project')).toBeVisible()
    await expect(page.locator('text=Created by E2E auth test')).toBeVisible()

    // 7. Test logout functionality
    await userDropdown.click()
    await page.click('text=Sign out')

    // Should redirect back to login
    await page.waitForURL(/\/login/, { timeout: 5000 })
    await expect(page.locator('h2')).toContainText('Sign in to your account')

    // Should not be able to access protected routes after logout
    await page.goto(`${APP_URL}/projects`)
    await page.waitForURL(/\/login/, { timeout: 5000 })
  })

  test('should handle redirect after login correctly', async ({ page }) => {
    // Skip this test if auth is not required
    test.skip(!REQUIRE_AUTH, 'This test requires REQUIRE_AUTH=true environment')
    
    // Test that users are redirected to their intended destination after login
    
    // Try to access a specific protected route
    await page.goto(`${APP_URL}/tasks`)
    await page.waitForURL(/\/login\?redirect=/, { timeout: 10000 })
    
    // Should be on login page with redirect parameter
    const url = page.url()
    expect(url).toContain('redirect=%2Ftasks')

    // Create and login with a test user
    const testUser = await createTestUser()
    
    await page.fill('input[name="email"]', testUser.email)
    await page.fill('input[name="password"]', testUser.password)
    await page.click('button[type="submit"]')

    // Should redirect to the original intended destination (/tasks)
    await page.waitForURL(/\/tasks/, { timeout: 10000 })
    await expect(page.locator('text=Tasks')).toBeVisible()
  })

  test('should handle invalid login attempts gracefully', async ({ page }) => {
    // This test works in both auth modes - just tests the login page functionality
    
    await page.goto(`${APP_URL}/login`)
    await page.waitForLoadState('load')

    // Should see login form
    await expect(page.locator('h2')).toContainText('Sign in to your account')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()

    // Try to login with invalid credentials
    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')

    // Should show error message and stay on login page
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
    
    // Form should still be functional
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
  })

  test('should display auth UI components correctly', async ({ page }) => {
    // Test the auth UI components work in both auth modes
    
    // Test login page
    await page.goto(`${APP_URL}/login`)
    await page.waitForLoadState('load')
    
    // Should show proper login page structure
    await expect(page.locator('h1')).toContainText('Work Squared')
    await expect(page.locator('h2')).toContainText('Sign in to your account')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Sign in')
    
    // Should have link to signup
    await expect(page.locator('text=Sign up')).toBeVisible()
    
    // Test dev mode indicator (shown when REQUIRE_AUTH=false)
    if (!REQUIRE_AUTH) {
      await expect(page.locator('text=Dev Mode')).toBeVisible()
    }

    // Test signup page
    await page.click('text=Sign up')
    await page.waitForURL(/\/signup/, { timeout: 5000 })
    
    await expect(page.locator('h2')).toContainText('Create your account')
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toContainText('Create account')
    
    // Should have link back to login
    await expect(page.locator('text=Sign in')).toBeVisible()
    
    // Test dev mode indicator on signup too
    if (!REQUIRE_AUTH) {
      await expect(page.locator('text=Dev Mode')).toBeVisible()
    }
  })

  test('should validate signup form correctly', async ({ page }) => {
    // Test client-side validation on signup form
    
    await page.goto(`${APP_URL}/signup`)
    await page.waitForLoadState('load')
    
    // Test empty form submission
    await page.click('button[type="submit"]')
    // Browser validation should prevent submission
    
    // Test password mismatch
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.fill('input[name="confirmPassword"]', 'different123')
    await page.click('button[type="submit"]')
    
    // Should show password mismatch error
    await expect(page.locator('text=Passwords do not match')).toBeVisible()
    
    // Test short password
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')
    await page.click('button[type="submit"]')
    
    // Should show password length error
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
    
    // Test invalid email
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', 'validpassword123')
    await page.fill('input[name="confirmPassword"]', 'validpassword123')
    await page.click('button[type="submit"]')
    
    // Should show email validation error
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible()
  })

  test('should work in development mode without auth tokens', async ({ page }) => {
    // This tests the current behavior: REQUIRE_AUTH=false allows development access
    // The app should use the insecure token automatically

    // Navigate to app without pre-injecting any auth tokens
    await page.goto(APP_URL)

    // Use load state instead of networkidle to avoid hanging
    await page.waitForLoadState('load', { timeout: 30000 })
    await page.waitForTimeout(3000) // Give LiveStore time to initialize

    // App should work in development mode
    await expect(page).toHaveURL(new RegExp(APP_URL))

    // Should not show auth errors since auth is disabled
    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('Authentication required')
    expect(bodyText).not.toContain('Please log in')

    // App should be functional - basic content should be visible
    const hasContent = await page.locator('body').isVisible()
    expect(hasContent).toBeTruthy()
  })

  test('should handle development mode gracefully', async ({ page }) => {
    // Test current development setup where auth is optional

    // Navigate to app
    await page.goto(APP_URL)

    // Use load state instead of networkidle to avoid hanging
    await page.waitForLoadState('load', { timeout: 30000 })
    await page.waitForTimeout(2000) // Brief wait for app initialization

    // App should not crash or show error pages
    await expect(page).toHaveURL(new RegExp(APP_URL))

    const bodyText = await page.textContent('body')
    expect(bodyText).not.toContain('Error')
    expect(bodyText).not.toContain('500')
    expect(bodyText).not.toContain('Failed to load')

    // Should show the main app interface
    const appLoaded = await page.locator('body').isVisible()
    expect(appLoaded).toBeTruthy()
  })
})
