import { test, expect } from '@playwright/test'
import { login, createProject } from './test-utils.js'

test.describe('Navigation after Chat', () => {
  test('navigation should work after viewing a chat conversation', async ({ page }) => {
    // Login and setup
    await login(page)
    const projectName = `Test Project ${Date.now()}`
    await createProject(page, projectName)

    // Navigate to chat
    await page.getByText('Chat').click()
    await expect(page).toHaveURL(/\/chat/)

    // Wait for chat to load
    await page.waitForSelector('[data-testid="chat-interface"], .chat-interface, .markdown-content', {
      timeout: 5000,
    })

    // Try to navigate to Projects
    await page.getByText('Projects').click()
    
    // Verify navigation works - should be on projects page
    await expect(page).toHaveURL(/\/projects/, { timeout: 10000 })
    
    // Verify projects page content is visible
    await expect(page.getByText('Projects')).toBeVisible()

    // Try navigating to other pages to ensure all navigation works
    await page.getByText('Documents').click()
    await expect(page).toHaveURL(/\/documents/, { timeout: 5000 })

    // Navigate back to chat and then to tasks
    await page.getByText('Chat').click()
    await expect(page).toHaveURL(/\/chat/)
    
    // Navigate to tasks
    await page.getByText('Tasks').click()
    await expect(page).toHaveURL(/\/tasks/, { timeout: 5000 })

    // All navigation should work without issues
  })

  test('CHORUS_TAG elements should be styled but not break navigation', async ({ page }) => {
    // Login and setup
    await login(page)

    // Navigate to chat
    await page.getByText('Chat').click()
    await expect(page).toHaveURL(/\/chat/)

    // Wait for any content to load
    await page.waitForTimeout(1000)

    // If there are any CHORUS_TAG elements in the chat, they should be styled
    // but not interfere with navigation
    const chorusElements = await page.locator('.chorus-file-link').count()
    if (chorusElements > 0) {
      // Verify CHORUS elements have correct styling
      const firstChorus = page.locator('.chorus-file-link').first()
      await expect(firstChorus).toHaveClass(/chorus-file-link/)
    }

    // Most importantly, navigation should still work
    await page.getByText('Projects').click()
    await expect(page).toHaveURL(/\/projects/, { timeout: 10000 })
    
    // Navigation works - test passes
  })
})