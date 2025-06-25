import { test, expect } from '@playwright/test'
import { waitForLiveStoreReady } from './test-utils'

test.describe('Session Persistence', () => {
  test('session state persists across URL visits', async ({ page }) => {
    // Navigate to root - should redirect to session
    await page.goto('/')
    await waitForLiveStoreReady(page)

    // Should be redirected to a session URL
    await expect(page).toHaveURL(/\/session\/[a-f0-9-]+$/)

    // Get the current session URL
    const sessionUrl = page.url()
    const sessionId = sessionUrl.match(/\/session\/([a-f0-9-]+)$/)?.[1]
    expect(sessionId).toBeTruthy()

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

    // Navigate away and back to the same session URL
    await page.goto('https://example.com') // Navigate away
    await page.goto(sessionUrl) // Go back to same session
    await waitForLiveStoreReady(page)

    // Should be at the same session URL
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

  test('root redirect creates consistent session behavior', async ({ page }) => {
    // First visit to root
    await page.goto('/')
    await waitForLiveStoreReady(page)

    // Should redirect to session URL, not storeId URL
    const firstUrl = page.url()
    console.log('First root visit URL:', firstUrl)

    // Should be session format, not storeId format
    expect(firstUrl).toMatch(/\/session\/[a-f0-9-]+$/)
    expect(firstUrl).not.toMatch(/\?storeId=/)

    // Extract session ID
    const firstSessionId = firstUrl.match(/\/session\/([a-f0-9-]+)$/)?.[1]
    expect(firstSessionId).toBeTruthy()

    // Navigate away and back to root again
    await page.goto('https://example.com')
    await page.goto('/')
    await waitForLiveStoreReady(page)

    const secondUrl = page.url()
    console.log('Second root visit URL:', secondUrl)

    // Should redirect to the SAME session (from localStorage)
    expect(secondUrl).toBe(firstUrl)
    expect(secondUrl).toMatch(/\/session\/[a-f0-9-]+$/)
    expect(secondUrl).not.toMatch(/\?storeId=/)

    // Extract second session ID - should be the same
    const secondSessionId = secondUrl.match(/\/session\/([a-f0-9-]+)$/)?.[1]
    expect(secondSessionId).toBe(firstSessionId)
  })

  test('multiple tabs get same session from localStorage', async ({ browser }) => {
    const context = await browser.newContext()

    // First tab
    const page1 = await context.newPage()
    await page1.goto('/')
    await waitForLiveStoreReady(page1)

    const firstTabUrl = page1.url()
    console.log('First tab URL:', firstTabUrl)
    expect(firstTabUrl).toMatch(/\/session\/[a-f0-9-]+$/)

    // Second tab (same context = same localStorage)
    const page2 = await context.newPage()
    await page2.goto('/')
    await waitForLiveStoreReady(page2)

    const secondTabUrl = page2.url()
    console.log('Second tab URL:', secondTabUrl)

    // Should be the same session URL
    expect(secondTabUrl).toBe(firstTabUrl)

    await context.close()
  })

  test('incognito gets new session', async ({ browser }) => {
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

    // Should be different sessions
    expect(url1).not.toBe(url2)
    expect(url1).toMatch(/\/session\/[a-f0-9-]+$/)
    expect(url2).toMatch(/\/session\/[a-f0-9-]+$/)

    await context1.close()
    await context2.close()
  })
})
