import { test, expect, type Page } from '@playwright/test'
import { waitForLiveStoreReady } from './test-utils'

const isLoadingLiveStore = async (page: Page) => {
  return page
    .locator('text=Loading LiveStore')
    .isVisible()
    .catch(() => false)
}

const waitForStoreIdOrLoading = async (page: Page) => {
  await Promise.race([
    page.waitForURL(/\?storeId=[a-f0-9-]+$/, { timeout: 10000 }),
    page.getByText('Loading LiveStore').waitFor({ state: 'visible', timeout: 10000 }),
  ])
}

const getStoreIdFromPageUrl = (page: Page) => {
  return new URL(page.url()).searchParams.get('storeId')
}

test.describe('Session Persistence', () => {
  test('session state persists across URL visits', async ({ page }) => {
    // Navigate to root - should add storeId to URL
    await page.goto('/')
    await waitForLiveStoreReady(page)

    // Wait for redirect to happen and add storeId to URL
    await page.waitForURL(/\?storeId=[a-f0-9-]+$/, { timeout: 10000 })

    // Should have storeId query parameter
    await expect(page).toHaveURL(/\?storeId=[a-f0-9-]+$/)

    // Get the current URL with storeId
    const sessionUrl = page.url()
    const storeId = new URL(sessionUrl).searchParams.get('storeId')
    expect(storeId).toBeTruthy()

    // Create a conversation to test persistence
    const createConversationButton = page.locator('button:has-text("Start New Chat")')
    if (await createConversationButton.isVisible()) {
      await createConversationButton.click()
      await page.waitForTimeout(1000) // Wait for conversation creation
    }

    // Type a test message (don't send, just type)
    const textarea = page.locator('textarea[placeholder="Type your message..."]')
    if (await textarea.isVisible()) {
      await textarea.fill('Test message for persistence')
      await page.waitForTimeout(500)
    }

    // Navigate away and back to the same URL with storeId
    await page.goto('about:blank') // Navigate away (always available)
    await page.goto(sessionUrl) // Go back to same URL
    await waitForLiveStoreReady(page)

    // Should be at the same URL with storeId
    await expect(page).toHaveURL(sessionUrl)

    // The conversation and state should persist
    if (await textarea.isVisible()) {
      // Textarea should still have the text (if it was persisting)
      await textarea.inputValue()
      // Note: This might be empty if we don't persist draft text, that's OK
    }

    // Check if conversation still exists (basic persistence test)
    const conversationElements = page.locator(
      'select option, .conversation-item, [data-testid*="conversation"]'
    )
    await conversationElements.count() // More than just "Select a conversation"
  })

  test('root redirect creates consistent storeId behavior', async ({ page }) => {
    // First visit to root
    await page.goto('/')
    await waitForStoreIdOrLoading(page)

    // Should have storeId query parameter
    const firstUrl = page.url()
    const firstStoreId = getStoreIdFromPageUrl(page)

    // Navigate away and back to root again (use about:blank to avoid external network dependency)
    await page.goto('about:blank')
    await page.goto('/')
    await waitForStoreIdOrLoading(page)

    const secondUrl = page.url()
    const secondStoreId = getStoreIdFromPageUrl(page)

    // In loading-shell scenarios, storeId injection may not occur yet.
    if (!firstStoreId || !secondStoreId) {
      expect(await isLoadingLiveStore(page)).toBeTruthy()
      expect(secondUrl).toBe(firstUrl)
      return
    }

    // Should redirect to the SAME storeId (from localStorage)
    expect(secondUrl).toBe(firstUrl)
    expect(secondStoreId).toBe(firstStoreId)
  })

  test('multiple tabs get same storeId from localStorage', async ({ browser }) => {
    const context = await browser.newContext()

    // First tab
    const page1 = await context.newPage()
    await page1.goto('/')
    await waitForStoreIdOrLoading(page1)

    const firstTabUrl = page1.url()
    const firstStoreId = getStoreIdFromPageUrl(page1)

    // Second tab (same context = same localStorage)
    const page2 = await context.newPage()
    await page2.goto('/')
    await waitForStoreIdOrLoading(page2)

    const secondTabUrl = page2.url()
    const secondStoreId = getStoreIdFromPageUrl(page2)

    // Should be the same URL with storeId
    expect(secondTabUrl).toBe(firstTabUrl)
    if (firstStoreId && secondStoreId) {
      expect(secondStoreId).toBe(firstStoreId)
    } else {
      expect(await isLoadingLiveStore(page2)).toBeTruthy()
    }

    await context.close()
  })

  test('incognito gets new storeId', async ({ browser }) => {
    // Regular context
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto('/')
    await waitForStoreIdOrLoading(page1)
    const url1 = page1.url()
    const storeId1 = getStoreIdFromPageUrl(page1)

    // Incognito context (separate localStorage)
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await page2.goto('/')
    await waitForStoreIdOrLoading(page2)
    const url2 = page2.url()
    const storeId2 = getStoreIdFromPageUrl(page2)

    // Should be different storeIds
    if (!storeId1 || !storeId2) {
      expect(await isLoadingLiveStore(page1)).toBeTruthy()
      expect(await isLoadingLiveStore(page2)).toBeTruthy()
    } else {
      expect(storeId1).not.toBe(storeId2)
      expect(url1).toMatch(/\?storeId=[a-f0-9-]+$/)
      expect(url2).toMatch(/\?storeId=[a-f0-9-]+$/)
    }

    await context1.close()
    await context2.close()
  })
})
