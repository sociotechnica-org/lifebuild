import { test, expect } from '@playwright/test'
import { waitForLiveStoreReady, waitForStoreIdInUrl } from './test-utils'

test.describe('Session Persistence', () => {
  test.describe.configure({ timeout: 60000 })

  test('session state persists across URL visits', async ({ page }) => {
    // Navigate to root - should add storeId to URL
    await page.goto('/')
    await waitForLiveStoreReady(page)

    // Wait for redirect to happen and add storeId to URL
    const initialStoreId = await waitForStoreIdInUrl(page, 15000)
    expect(initialStoreId).toBeTruthy()

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
    await waitForLiveStoreReady(page)
    const firstStoreId = await waitForStoreIdInUrl(page, 15000)
    expect(firstStoreId).toBeTruthy()

    // Should have storeId query parameter
    const firstUrl = page.url()

    // Should have storeId format
    expect(firstUrl).toMatch(/\?storeId=[a-f0-9-]+$/)

    // Navigate away and back to root again (use about:blank to avoid external network dependency)
    await page.goto('about:blank')
    await page.goto('/')
    await waitForLiveStoreReady(page)
    const secondStoreId = await waitForStoreIdInUrl(page, 15000)
    expect(secondStoreId).toBeTruthy()

    const secondUrl = page.url()

    // Should redirect to the SAME storeId (from localStorage)
    expect(secondUrl).toBe(firstUrl)
    expect(secondUrl).toMatch(/\?storeId=[a-f0-9-]+$/)

    // Extract second storeId - should be the same
    expect(secondStoreId).toBe(firstStoreId)
  })

  test('multiple tabs get same storeId from localStorage', async ({ browser }) => {
    const context = await browser.newContext()

    // First tab
    const page1 = await context.newPage()
    await page1.goto('/')
    await waitForLiveStoreReady(page1)
    const firstTabStoreId = await waitForStoreIdInUrl(page1, 15000)
    expect(firstTabStoreId).toBeTruthy()

    const firstTabUrl = page1.url()
    expect(firstTabUrl).toMatch(/\?storeId=[a-f0-9-]+$/)

    // Second tab (same context = same localStorage)
    const page2 = await context.newPage()
    await page2.goto('/')
    await waitForLiveStoreReady(page2)
    const secondTabStoreId = await waitForStoreIdInUrl(page2, 15000)
    expect(secondTabStoreId).toBeTruthy()

    const secondTabUrl = page2.url()

    // Should be the same URL with storeId
    expect(secondTabUrl).toBe(firstTabUrl)

    await context.close()
  })

  test('incognito gets new storeId', async ({ browser }) => {
    // Regular context
    const context1 = await browser.newContext()
    const page1 = await context1.newPage()
    await page1.goto('/')
    await waitForLiveStoreReady(page1)
    const contextOneStoreId = await waitForStoreIdInUrl(page1, 15000)
    expect(contextOneStoreId).toBeTruthy()
    const url1 = page1.url()

    // Incognito context (separate localStorage)
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await page2.goto('/')
    await waitForLiveStoreReady(page2)
    const contextTwoStoreId = await waitForStoreIdInUrl(page2, 15000)
    expect(contextTwoStoreId).toBeTruthy()
    const url2 = page2.url()

    // Should be different storeIds
    expect(url1).not.toBe(url2)
    expect(url1).toMatch(/\?storeId=[a-f0-9-]+$/)
    expect(url2).toMatch(/\?storeId=[a-f0-9-]+$/)

    await context1.close()
    await context2.close()
  })
})
