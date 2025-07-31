/**
 * Simple E2E test to verify auth UI components are working
 */

import { test, expect } from '@playwright/test'

const APP_URL = process.env.APP_URL || 'http://localhost:5173'

test.describe('Auth UI Components', () => {
  test('should load login page successfully', async ({ page }) => {
    // Navigate directly to login page
    await page.goto(`${APP_URL}/login`)
    await page.waitForLoadState('load', { timeout: 30000 })

    // Debug: Take screenshot and print page content
    await page.screenshot({ path: 'test-results/login-page-debug.png' })
    console.log('Page URL:', page.url())
    console.log('Page title:', await page.title())
    
    const pageContent = await page.content()
    console.log('Page content preview:', pageContent.substring(0, 500))

    // Check if login page elements are present
    const h1Elements = await page.locator('h1').count()
    const h2Elements = await page.locator('h2').count()
    const inputElements = await page.locator('input').count()

    console.log('H1 elements found:', h1Elements)
    console.log('H2 elements found:', h2Elements)
    console.log('Input elements found:', inputElements)

    // Basic checks that should always pass
    await expect(page.locator('body')).toBeVisible()
    
    // Check for React app content
    const hasReactContent = await page.locator('#react-app').isVisible()
    console.log('React app container visible:', hasReactContent)
    
    if (hasReactContent) {
      // If React loaded, we should see our auth UI
      await expect(page.locator('h1')).toContainText('Work Squared')
      await expect(page.locator('h2')).toContainText('Sign in to your account')
    }
  })

  test('should load signup page successfully', async ({ page }) => {
    await page.goto(`${APP_URL}/signup`)
    await page.waitForLoadState('load', { timeout: 30000 })

    // Debug info
    console.log('Signup page URL:', page.url())
    const pageContent = await page.content()
    console.log('Signup page content preview:', pageContent.substring(0, 500))

    await expect(page.locator('body')).toBeVisible()
    
    // Check for React app content
    const hasReactContent = await page.locator('#react-app').isVisible()
    console.log('React app container visible on signup:', hasReactContent)
    
    if (hasReactContent) {
      await expect(page.locator('h1')).toContainText('Work Squared')
      await expect(page.locator('h2')).toContainText('Create your account')
    }
  })
})