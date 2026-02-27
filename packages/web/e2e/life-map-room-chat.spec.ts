import { expect, test } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

test.describe('Attendant rail', () => {
  test('opens, closes, and switches attendant chat panels from the rail', async ({ page }) => {
    await navigateToAppWithUniqueStore(page)

    const jarvisAvatar = page.getByTestId('attendant-rail-avatar-jarvis')
    const marvinAvatar = page.getByTestId('attendant-rail-avatar-marvin')

    await expect(jarvisAvatar).toBeVisible()
    await expect(marvinAvatar).toBeVisible()

    await jarvisAvatar.click()
    await expect(page.getByTestId('attendant-chat-panel')).toBeVisible()
    await expect(page.getByTestId('room-chat-panel')).toContainText('Jarvis')

    await jarvisAvatar.click()
    await expect(page.getByTestId('attendant-chat-panel')).toHaveCount(0)

    await marvinAvatar.click()
    await expect(page.getByTestId('attendant-chat-panel')).toBeVisible()
    await expect(page.getByTestId('room-chat-panel')).toContainText('Marvin')

    await jarvisAvatar.click()
    await expect(page.getByTestId('attendant-chat-panel')).toBeVisible()
    await expect(page.getByTestId('room-chat-panel')).toContainText('Jarvis')
  })

  test('auto-selects attendants based on route context', async ({ page }) => {
    const storeId = await navigateToAppWithUniqueStore(page)

    await page.goto(`/sanctuary?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    const jarvisAvatar = page.getByTestId('attendant-rail-avatar-jarvis')
    const marvinAvatar = page.getByTestId('attendant-rail-avatar-marvin')

    await expect(page.getByTestId('attendant-chat-panel')).toBeVisible()
    await expect(page.getByTestId('room-chat-panel')).toContainText('Jarvis')
    await expect(jarvisAvatar).toHaveAttribute('aria-pressed', 'true')
    await expect(marvinAvatar).toHaveAttribute('aria-pressed', 'false')

    await page.goto(`/projects/test-project?storeId=${storeId}`)
    await waitForLiveStoreReady(page)

    await expect(page.getByTestId('attendant-chat-panel')).toBeVisible()
    await expect(page.getByTestId('room-chat-panel')).toContainText('Marvin')
    await expect(jarvisAvatar).toHaveAttribute('aria-pressed', 'false')
    await expect(marvinAvatar).toHaveAttribute('aria-pressed', 'true')
  })
})
