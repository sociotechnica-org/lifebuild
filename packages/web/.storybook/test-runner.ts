import type { TestRunnerConfig } from '@storybook/test-runner'

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

  async postVisit(page) {
    // Wait a bit for content to render
    await page.waitForTimeout(1000)

    // Basic smoke test - just check that no uncaught errors occurred
    // The default test runner behavior will handle the rest
    const errors = await page.evaluate(() => {
      // Check for any JavaScript errors in the console
      return (window as any).storybookErrors || []
    })

    if (errors.length > 0) {
      console.warn('Story had JavaScript errors:', errors)
    }

    // If we get here, the story loaded without throwing uncaught exceptions
  },

  // Tags to run/skip
  tags: {
    include: [], // Run all stories by default
    exclude: [], // No stories to exclude by default
  },
}

export default config
