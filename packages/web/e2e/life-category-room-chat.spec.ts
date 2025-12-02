import { test, expect } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

test.describe('Life Category room chat', () => {
  test('Health room provisions Maya and sends a message', async ({ page }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    await page.goto(`/new/category/health?storeId=${storeId}&roomChat=1`)
    await waitForLiveStoreReady(page)

    const toggle = page.getByRole('button', { name: /open chat/i })
    await expect(toggle).toBeVisible()
    await toggle.click()

    const chatPanel = page.getByTestId('room-chat-panel')
    await expect(chatPanel).toBeVisible()
    await expect(chatPanel.getByRole('heading', { name: 'Maya' })).toBeVisible()

    const textarea = page.getByPlaceholder('Ask something…')
    await expect(textarea).toBeEnabled({ timeout: 10000 })

    const message = 'Checking in from Playwright'
    await textarea.fill(message)
    await textarea.press('Enter')

    await expect(chatPanel.getByText(message)).toBeVisible()
  })
})
