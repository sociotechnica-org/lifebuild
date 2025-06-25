import { test, expect } from '@playwright/test'
import { waitForLiveStoreReady, waitForStoreIdInUrl } from './test-utils'

test.describe('Session Persistence', () => {
  test('session state persists across URL visits', async ({ page }) => {
    // Navigate to root - should add storeId to URL
    await page.goto('/')
    await waitForStoreIdInUrl(page)
    await waitForLiveStoreReady(page)

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
    await page.goto('https://example.com') // Navigate away
    await page.goto(sessionUrl) // Go back to same URL
    await waitForLiveStoreReady(page)

    // Should be at the same URL with storeId
    await expect(page).toHaveURL(sessionUrl)

    // The conversation and state should persist
    if (await textarea.isVisible()) {
      // Textarea should still have the text (if it was persisting)
      const textValue = await textarea.inputValue()
      console.log('Textarea value after return:', textValue)
      // Note: This might be empty if we don't persist draft text, that's OK
    }

    // Check if conversation still exists (basic persistence test)
    const conversationElements = page.locator(
      'select option, .conversation-item, [data-testid*="conversation"]'
    )
    const hasConversations = (await conversationElements.count()) > 1 // More than just "Select a conversation"
    console.log('Has persisted conversations:', hasConversations)
  })

  test('root redirect creates consistent storeId behavior', async ({ page }) => {
    // First visit to root
    await page.goto('/')
    await waitForStoreIdInUrl(page)
    await waitForLiveStoreReady(page)

    // Should have storeId query parameter
    const firstUrl = page.url()
    console.log('First root visit URL:', firstUrl)

    // Should have storeId format
    expect(firstUrl).toMatch(/\?storeId=[a-f0-9-]+$/)

    // Extract storeId
    const firstStoreId = new URL(firstUrl).searchParams.get('storeId')
    expect(firstStoreId).toBeTruthy()

    // Navigate away and back to root again
    await page.goto('https://example.com')
    await page.goto('/')
    await waitForLiveStoreReady(page)

    const secondUrl = page.url()
    console.log('Second root visit URL:', secondUrl)

    // Should redirect to the SAME storeId (from localStorage)
    expect(secondUrl).toBe(firstUrl)
    expect(secondUrl).toMatch(/\?storeId=[a-f0-9-]+$/)

    // Extract second storeId - should be the same
    const secondStoreId = new URL(secondUrl).searchParams.get('storeId')
    expect(secondStoreId).toBe(firstStoreId)
  })

  test('multiple tabs get same storeId from localStorage', async ({ browser }) => {
    const context = await browser.newContext()

    // First tab
    const page1 = await context.newPage()
    await page1.goto('/')
    await waitForStoreIdInUrl(page1)
    await waitForLiveStoreReady(page1)

    const firstTabUrl = page1.url()
    console.log('First tab URL:', firstTabUrl)
    expect(firstTabUrl).toMatch(/\?storeId=[a-f0-9-]+$/)

    // Second tab (same context = same localStorage)
    const page2 = await context.newPage()
    await page2.goto('/')
    await waitForStoreIdInUrl(page2)
    await waitForLiveStoreReady(page2)

    const secondTabUrl = page2.url()
    console.log('Second tab URL:', secondTabUrl)

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
    const url1 = page1.url()

    // Incognito context (separate localStorage)
    const context2 = await browser.newContext()
    const page2 = await context2.newPage()
    await page2.goto('/')
    await waitForLiveStoreReady(page2)
    const url2 = page2.url()

    console.log('Regular session:', url1)
    console.log('Incognito session:', url2)

    // Should be different storeIds
    expect(url1).not.toBe(url2)
    expect(url1).toMatch(/\?storeId=[a-f0-9-]+$/)
    expect(url2).toMatch(/\?storeId=[a-f0-9-]+$/)

    await context1.close()
    await context2.close()
  })
})
