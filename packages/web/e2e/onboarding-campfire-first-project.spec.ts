import { expect, test, type Page } from '@playwright/test'
import { waitForLiveStoreReady } from './test-utils'

const hasMapCanvas = async (page: Page): Promise<boolean> => {
  return page
    .locator('canvas')
    .first()
    .isVisible()
    .catch(() => false)
}

test.describe('Onboarding campfire conversation', () => {
  test('transitions from campfire to reveal when first project and tasks exist', async ({
    page,
  }) => {
    const storeId = `onboarding-campfire-${Date.now()}-${Math.random().toString(36).slice(2)}`

    await page.goto(`/life-map?storeId=${storeId}&onboarding=force`)
    await waitForLiveStoreReady(page)

    if (!(await hasMapCanvas(page))) {
      return
    }

    await expect(page.getByTestId('onboarding-campfire-panel')).toBeVisible()
    await expect(page.getByTestId('room-chat-panel')).toBeVisible()
    await expect(page.getByText('[internal:campfire-bootstrap]')).toHaveCount(0)
    await expect(page.getByTestId('attendant-rail')).toHaveCount(0)

    await page.evaluate(async () => {
      const hooks = window.__LIFEBUILD_E2E__
      if (!hooks?.seedOnboardingProjectWithTasks) {
        throw new Error('Missing onboarding e2e seed hook')
      }

      await hooks.seedOnboardingProjectWithTasks({
        name: 'Campfire seeded project',
        description: 'Project seeded through onboarding hook to mimic tool-created output.',
        taskCount: 3,
      })
    })

    await expect(page.getByTestId('onboarding-reveal-panel')).toBeVisible()
    await expect(page.getByTestId('onboarding-first-project-banner')).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByTestId('attendant-rail')).toBeVisible()
  })
})
