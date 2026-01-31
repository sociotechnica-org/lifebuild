import { test, expect } from '@playwright/test'

const dashboardPort = process.env.SERVER_DASHBOARD_PORT || '3103'
const dashboardToken = process.env.SERVER_DASHBOARD_TOKEN || 'test-bypass-token'
const baseUrl = `http://localhost:${dashboardPort}`

test.describe('Server dashboard', () => {
  test('shows store health and network info', async ({ page }) => {
    await page.goto(`${baseUrl}/?token=${dashboardToken}`)

    await expect(page.getByRole('heading', { name: 'LifeBuild Multi-Store Server' })).toBeVisible()
    await expect(page.getByText('System Overview')).toBeVisible()
    await expect(page.getByText('Store Status')).toBeVisible()

    const storeId = 'playwright-dashboard'
    await expect(page.getByText(storeId)).toBeVisible()
    await expect(page.getByText('Network:')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Recreate Store' })).toBeVisible()

    const healthResponse = await page.request.get(`${baseUrl}/health`)
    expect(healthResponse.ok()).toBeTruthy()
    const healthJson = await healthResponse.json()
    expect(healthJson).toHaveProperty('stores')
  })
})
