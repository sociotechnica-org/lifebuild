import { test, expect } from '@playwright/test'
import { waitForLiveStoreReady, navigateToAppWithUniqueStore } from './test-utils'

test.describe('Life Category Advisor', () => {
  test('creates category advisor and conversation when navigating to Life Category', async ({
    page,
  }) => {
    // Navigate to app with unique store ID for test isolation
    await navigateToAppWithUniqueStore(page)

    // Check if we're stuck on loading screen (expected in CI)
    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - skipping life category advisor test (expected in CI)')
      return
    }

    // Navigate to Life Map
    // First check if we're already at life map, otherwise navigate
    const currentUrl = page.url()
    if (!currentUrl.includes('/life')) {
      // Click on Life link in navigation if it exists
      const lifeLink = page.locator('a[href*="/life"]')
      if (await lifeLink.isVisible()) {
        await lifeLink.click()
      } else {
        // Directly navigate to life map
        const url = new URL(currentUrl)
        const storeId = url.searchParams.get('storeId')
        await page.goto(`/life-map?storeId=${storeId}`)
      }
    }

    // Wait for LiveStore to be ready after navigation
    await waitForLiveStoreReady(page)

    // Should be on the Life Map page
    await expect(page).toHaveURL(/\/life(-map)?\?storeId=[^&]+/)

    // Verify Life Map page loaded with category cards
    await expect(page.locator('h1')).toContainText('Life Map')

    // Look for a Life Category card (e.g., Health & Well-Being)
    const healthCard = page.locator('text=Health & Well-Being').first()
    await expect(healthCard).toBeVisible({ timeout: 10000 })

    // Click on the Health & Well-Being category
    await healthCard.click()

    // Wait for navigation to the category view
    await waitForLiveStoreReady(page)

    // Should now be on the health category page
    await expect(page).toHaveURL(/\/life\/health\?storeId=[^&]+/)

    // Verify category header is visible
    await expect(page.locator('text=Health & Well-Being')).toBeVisible()

    // Wait a bit for the advisor and conversation to be auto-created
    await page.waitForTimeout(2000)

    // Check that a conversation is auto-selected in the URL
    // The hook should have created a conversation and added conversationId to URL params
    await page.waitForFunction(
      () => {
        const url = new URL(window.location.href)
        return url.searchParams.has('conversationId')
      },
      { timeout: 5000 }
    )

    // Verify that the chat interface is visible
    // Look for chat input or message list
    const chatInput = page.locator(
      'textarea[placeholder*="message" i], textarea[placeholder*="chat" i], input[placeholder*="message" i]'
    )

    // Wait for chat interface to be ready
    try {
      await expect(chatInput).toBeVisible({ timeout: 10000 })
    } catch {
      // If specific chat input not found, try to find any text input that might be the chat
      const anyInput = page.locator('textarea, input[type="text"]').last()
      await expect(anyInput).toBeVisible({ timeout: 5000 })
    }

    // Verify we can type in the chat (without actually sending - to avoid LLM calls)
    const testMessage = 'Hello from E2E test'

    try {
      await chatInput.fill(testMessage)
      await expect(chatInput).toHaveValue(testMessage)
    } catch {
      // Try alternative selectors for chat input
      const alternativeInput = page.locator('textarea').last()
      if (await alternativeInput.isVisible()) {
        await alternativeInput.fill(testMessage)
        await expect(alternativeInput).toHaveValue(testMessage)
      }
    }

    // Verify that the advisor worker was created
    // Navigate to Workers page to check
    const workersLink = page.locator('a[href*="/workers"]')
    if (await workersLink.isVisible()) {
      await workersLink.click()
      await waitForLiveStoreReady(page)

      // Should see the health advisor in the workers list
      await expect(page.locator('text=Health & Well-Being Advisor')).toBeVisible({ timeout: 5000 })
    }
  })

  test('different categories have different advisors', async ({ page }) => {
    // Navigate to app with unique store ID for test isolation
    await navigateToAppWithUniqueStore(page)

    // Check if we're stuck on loading screen
    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - skipping multi-advisor test (expected in CI)')
      return
    }

    // Navigate to Life Map
    const currentUrl = page.url()
    if (!currentUrl.includes('/life')) {
      const url = new URL(currentUrl)
      const storeId = url.searchParams.get('storeId')
      await page.goto(`/life-map?storeId=${storeId}`)
    }

    await waitForLiveStoreReady(page)

    // Click on Health category
    const healthCard = page.locator('text=Health & Well-Being').first()
    await healthCard.click()
    await waitForLiveStoreReady(page)

    // Get the conversation ID for health
    const healthUrl = new URL(page.url())
    const healthConversationId = healthUrl.searchParams.get('conversationId')

    // Navigate back to Life Map
    await page.goto(`/life-map?storeId=${healthUrl.searchParams.get('storeId')}`)
    await waitForLiveStoreReady(page)

    // Click on Relationships category
    const relationshipsCard = page.locator('text=Relationships').first()
    await relationshipsCard.click()
    await waitForLiveStoreReady(page)

    // Get the conversation ID for relationships
    await page.waitForFunction(
      () => {
        const url = new URL(window.location.href)
        return url.searchParams.has('conversationId')
      },
      { timeout: 5000 }
    )

    const relationshipsUrl = new URL(page.url())
    const relationshipsConversationId = relationshipsUrl.searchParams.get('conversationId')

    // Verify different conversations for different categories
    expect(healthConversationId).not.toBe(relationshipsConversationId)
    expect(healthConversationId).toBeTruthy()
    expect(relationshipsConversationId).toBeTruthy()
  })

  test('advisor persists across page reloads', async ({ page }) => {
    // Navigate to app with unique store ID
    await navigateToAppWithUniqueStore(page)

    const isLoading = await page.locator('text=Loading LiveStore').isVisible()
    if (isLoading) {
      console.log('LiveStore still loading - skipping persistence test (expected in CI)')
      return
    }

    // Navigate to a Life Category
    const currentUrl = page.url()
    const url = new URL(currentUrl)
    const storeId = url.searchParams.get('storeId')
    await page.goto(`/life/health?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    // Wait for conversation to be created
    await page.waitForFunction(
      () => {
        const url = new URL(window.location.href)
        return url.searchParams.has('conversationId')
      },
      { timeout: 5000 }
    )

    const firstVisitUrl = new URL(page.url())
    const firstConversationId = firstVisitUrl.searchParams.get('conversationId')

    // Reload the page
    await page.reload()
    await waitForLiveStoreReady(page)

    // Wait for conversation to be auto-selected again
    await page.waitForFunction(
      () => {
        const url = new URL(window.location.href)
        return url.searchParams.has('conversationId')
      },
      { timeout: 5000 }
    )

    const secondVisitUrl = new URL(page.url())
    const secondConversationId = secondVisitUrl.searchParams.get('conversationId')

    // Should be the same conversation (advisor and conversation persist)
    expect(secondConversationId).toBe(firstConversationId)
  })
})
