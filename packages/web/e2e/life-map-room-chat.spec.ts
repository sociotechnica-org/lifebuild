import { test, expect } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

test.describe('Life Map room chat', () => {
  test('shows read-only chat when life-map attendant is inactive', async ({ page }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    await page.goto(`/life-map?storeId=${storeId}&roomChat=1`)
    await waitForLiveStoreReady(page)

    const toggle = page.getByRole('button', { name: /open chat/i })
    await expect(toggle).toBeVisible()
    await toggle.click()

    const chatPanel = page.getByTestId('room-chat-panel')
    await expect(chatPanel).toBeVisible()

    const textarea = page.getByPlaceholder('Ask something…')
    await expect(textarea).toBeDisabled({ timeout: 10000 })

    await expect(chatPanel.getByTestId('room-chat-status')).toHaveText(
      "This room's agent is inactive."
    )
    await expect(chatPanel.getByText(/mesa/i)).toHaveCount(0)
  })
})
