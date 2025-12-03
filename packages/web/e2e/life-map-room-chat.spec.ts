import { test, expect } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

test.describe('Life Map room chat', () => {
  test('enables chat via feature override and sends a user message', async ({ page }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    await page.goto(`/life-map?storeId=${storeId}&roomChat=1`)
    await waitForLiveStoreReady(page)

    const toggle = page.getByRole('button', { name: /open chat/i })
    await expect(toggle).toBeVisible()
    await toggle.click()

    const chatPanel = page.getByTestId('room-chat-panel')
    await expect(chatPanel).toBeVisible()

    const textarea = page.getByPlaceholder('Ask something…')
    await expect(textarea).toBeEnabled({ timeout: 10000 })

    const message = 'Hello from Playwright'
    await textarea.fill(message)
    await textarea.press('Enter')

    await expect(chatPanel.getByText(message)).toBeVisible()
  })
})
