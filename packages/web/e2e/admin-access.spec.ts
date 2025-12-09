import { test, expect } from '@playwright/test'

test.describe('Admin Access Control', () => {
  const buildMockJwt = (overrides: Record<string, unknown> = {}) => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const payload = {
      exp: nowSeconds + 60 * 60 * 24 * 30, // 30 days in the future to avoid refresh
      iat: nowSeconds,
      ...overrides,
    }

    const base64Url = (data: string) =>
      Buffer.from(data)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

    const header = base64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    const body = base64Url(JSON.stringify(payload))
    return `${header}.${body}.signature`
  }

  test('unauthenticated user redirected to login when accessing admin', async ({ page }) => {
    // Try to access admin route without authentication
    await page.goto('/admin')

    // Should be redirected to login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('non-admin user redirected to projects when accessing admin', async ({ page }) => {
    // Set up localStorage with non-admin user data first
    await page.goto('/')
    const mockAccessToken = buildMockJwt()
    await page.evaluate(
      ({ token }) => {
        // Mock localStorage tokens for non-admin user
        localStorage.setItem('lifebuild-access-token', token)
        localStorage.setItem('lifebuild-refresh-token', 'mock-refresh-token')
        localStorage.setItem(
          'lifebuild-user-info',
          JSON.stringify({
            id: 'test-user',
            email: 'test@example.com',
            isAdmin: false,
            instances: [],
          })
        )
      },
      { token: mockAccessToken }
    )

    // Reload page to ensure auth context picks up the localStorage data
    await page.reload()

    // Try to access admin route as non-admin
    await page.goto('/admin')

    // Should be redirected to projects page (non-admin redirect)
    await expect(page).toHaveURL(/\/projects/)
  })

  test.skip('admin user can access admin route', async ({ page }) => {
    // Set up localStorage with admin user data first
    await page.goto('/')
    await page.evaluate(() => {
      // Mock localStorage tokens for admin user - the auth logic checks for these tokens
      localStorage.setItem('lifebuild-access-token', 'mock-admin-token')
      localStorage.setItem('lifebuild-refresh-token', 'mock-admin-refresh')
      localStorage.setItem(
        'lifebuild-user-info',
        JSON.stringify({
          id: 'admin-user',
          email: 'admin@example.com',
          isAdmin: true,
          instances: [],
        })
      )
    })

    // Reload page to ensure auth context picks up the localStorage data
    await page.reload()

    // Navigate to admin route as admin
    await page.goto('/admin')

    // Should successfully load admin page (not be redirected)
    await expect(page).toHaveURL('/admin')
    await expect(page.locator('h1')).toContainText('Admin: Users', { timeout: 10000 })
  })

  // Note: These tests use mocked auth state in localStorage to avoid
  // dependency on auth service availability in CI. The critical security
  // logic (JWT verification) happens server-side and is covered by unit tests.
  //
  // TODO: The 'admin user can access admin route' test is skipped because it
  // requires real JWT verification with local auth-worker setup.
  // See GitHub Issue #124 for multi-service E2E testing implementation.
})
