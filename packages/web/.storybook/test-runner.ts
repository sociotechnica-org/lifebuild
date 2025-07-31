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

  async postVisit(page, context) {
    // Custom assertions after story renders
    const storyElement = page.locator('#storybook-root')
    
    // Check that the story rendered successfully
    await expect(storyElement).toBeVisible()
    
    // Simple check - if we get here, the story rendered without throwing errors
    // More complex error checking could be added here if needed
  },

  // Tags to run/skip
  tags: {
    include: [],  // Run all stories by default
    exclude: [],  // No stories to exclude by default
  }
}

export default config