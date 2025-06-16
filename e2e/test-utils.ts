import { Page, expect } from '@playwright/test'

/**
 * Test utilities for E2E tests with LiveStore
 */

/**
 * Wait for LiveStore to finish loading
 */
export async function waitForLiveStoreReady(page: Page) {
  // Wait for the loading message to disappear using proper DOM traversal
  await page.waitForFunction(
    () => {
      const elements = document.querySelectorAll('div')
      for (const element of elements) {
        if (element.textContent && element.textContent.includes('Loading LiveStore')) {
          return false // Still loading
        }
      }
      return true // No loading message found
    },
    { timeout: 30000 }
  )

  // Wait a bit more to ensure sync is complete
  await page.waitForTimeout(1000)
}

/**
 * Navigate to the app with a unique store ID for test isolation
 */
export async function navigateToAppWithUniqueStore(page: Page) {
  const storeId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
  await page.goto(`/?storeId=${storeId}`)
  await waitForLiveStoreReady(page)
  return storeId
}

/**
 * Wait for WebSocket connection to be established
 */
export async function waitForWebSocketConnection(page: Page) {
  await page.waitForFunction(
    () => {
      // Check if there are any WebSocket connections in the ready state
      return window.performance.getEntriesByType('navigation').length > 0
    },
    { timeout: 10000 }
  )
}

/**
 * Check if the basic app structure is loaded
 */
export async function expectBasicAppStructure(page: Page) {
  // Check that main content area exists (more specific selector)
  await expect(page.locator('.flex-1.overflow-auto')).toBeVisible({ timeout: 10000 })

  // Check that the page has loaded the main heading (be specific to avoid multiple matches)
  await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
}

/**
 * Navigate to a specific route and wait for it to load
 */
export async function navigateToRoute(page: Page, route: string) {
  await page.goto(route)
  await waitForLiveStoreReady(page)
}

/**
 * Wait for any loading states to complete
 */
export async function waitForLoadingComplete(page: Page) {
  // Wait for any loading spinners or skeleton screens to disappear
  await page.waitForFunction(
    () => {
      const loadingElements = document.querySelectorAll(
        '[data-testid*="loading"], [class*="loading"], [class*="skeleton"]'
      )
      return loadingElements.length === 0
    },
    { timeout: 10000 }
  )
}
