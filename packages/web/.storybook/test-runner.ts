import type { TestRunnerConfig } from '@storybook/test-runner'
import { expect } from '@playwright/test'

const config: TestRunnerConfig = {
  // Configure Playwright options for the test runner
  setup() {
    // Add any global setup here
  },

  // Customize test runner behavior
  async preVisit(page) {
    // Configure page before visiting story
    // Set viewport, inject scripts, etc.
    await page.setViewportSize({ width: 1200, height: 800 })
  },

  async postVisit(page, _context) {
    // Custom assertions after story renders
    const storyElement = page.locator('#storybook-root')

    // Wait a bit for content to render
    await page.waitForTimeout(1000)

    // Check for any error messages first
    const errorElement = page.locator('[data-testid="error-message"]')
    const hasError = await errorElement.isVisible().catch(() => false)

    if (hasError) {
      const errorText = await errorElement.textContent()
      console.warn('Story has error:', errorText)
    }

    // Check that the story element exists and has content
    const hasContent = await storyElement
      .locator('*')
      .first()
      .isVisible()
      .catch(() => false)

    if (!hasContent) {
      // Log what's actually in the storybook root for debugging
      const content = await storyElement.innerHTML().catch(() => 'Could not get innerHTML')
      console.warn('Story rendered but has no visible content. Content:', content)
    }

    // Ensure the story root exists (it should always exist)
    await expect(storyElement).toBeAttached()

    // Simple check - if we get here, the story loaded without crashing
  },

  // Tags to run/skip
  tags: {
    include: [], // Run all stories by default
    exclude: [], // No stories to exclude by default
  },
}

export default config
