import { expect, test, type Locator, type Page } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

const DATE_ONLY = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const blockRemoteTextFontRequests = async (page: Page) => {
  await page.route('**://cdn.jsdelivr.net/gh/lojjic/unicode-font-resolver@*/**', route =>
    route.abort()
  )
  await page.route('**://fonts.googleapis.com/**', route => route.abort())
  await page.route('**://fonts.gstatic.com/**', route => route.abort())
}

const clickCanvasAtNormalizedPoint = async (
  page: Page,
  canvas: Locator,
  xRatio: number,
  yRatio: number
) => {
  const canvasHandle = await canvas.elementHandle({ timeout: 1500 }).catch(() => null)
  if (!canvasHandle) {
    throw new Error('Canvas is not available for click interaction')
  }

  const box = await canvasHandle.boundingBox()
  if (!box) {
    throw new Error('Canvas is not visible for click interaction')
  }

  await page.mouse.click(box.x + box.width * xRatio, box.y + box.height * yRatio)
}

const getHexCenterRatios = async (canvas: Locator, q: number, r: number) => {
  const box = await canvas.boundingBox()
  if (!box) {
    throw new Error('Canvas is not visible for coordinate conversion')
  }

  const aspectRatio = box.width / Math.max(box.height, 1)
  const sqrt3 = Math.sqrt(3)
  const xWorld = sqrt3 * q + (sqrt3 / 2) * r
  const zWorld = (3 / 2) * r
  const viewHeight = 8
  const elevationSin = Math.sin((31 * Math.PI) / 180)
  const xNdc = xWorld / (viewHeight * aspectRatio)
  const yNdc = -(elevationSin * zWorld) / viewHeight

  return {
    x: (xNdc + 1) / 2,
    y: (1 - yNdc) / 2,
  }
}

const createInitiativeProject = async (page: Page, storeId: string, projectName: string) => {
  await page.goto(`/drafting-room/new?storeId=${storeId}`)
  await waitForLiveStoreReady(page)

  await expect(page.getByText('Stage 1: Identify')).toBeVisible({ timeout: 10000 })
  await page.locator('input[placeholder*="project called"]').fill(projectName)
  await page.locator('textarea[placeholder*="1-2 sentences"]').fill('E2E placement flow coverage')
  await page.getByRole('button', { name: 'Health' }).click()
  await page.getByRole('button', { name: 'Continue to Stage 2' }).click()

  await expect(page.getByText('Stage 2: Scope')).toBeVisible({ timeout: 10000 })
  await page.locator('textarea[placeholder*="specific outcomes"]').fill('Place and remove project')
  await page.locator('input[type="date"]').fill(DATE_ONLY ?? '')
  await page.getByRole('button', { name: /^Initiative/ }).click()
  await page.getByRole('button', { name: 'Continue to Stage 3' }).click()

  await expect(page.getByText('Stage 3: Detail')).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: '+ Add Task' }).click()
  const modal = page.getByRole('dialog')
  await expect(modal).toBeVisible({ timeout: 5000 })
  await modal.locator('input[placeholder="Task title"]').fill('Placement test task')
  await modal.getByRole('button', { name: 'Create Task' }).click()
  await expect(modal).not.toBeVisible({ timeout: 5000 })

  await page.getByRole('button', { name: 'Add to Sorting' }).click()
  await expect(page.getByRole('heading', { name: 'Initiative' })).toBeVisible({ timeout: 10000 })
}

const activateInitiativeProject = async (page: Page, projectName: string) => {
  const initiativeSummaryHeader = page
    .locator('div')
    .filter({ hasText: /^Initiative\s*\d+\s*in backlog\s*(Expand|Hide)$/ })
    .first()
  const initiativeToggle = initiativeSummaryHeader.getByRole('button', { name: /Expand|Hide/ })
  if ((await initiativeToggle.textContent())?.trim() === 'Expand') {
    await initiativeToggle.click()
  }

  const projectCard = page
    .locator('div')
    .filter({ hasText: projectName })
    .filter({ has: page.getByRole('button', { name: 'Activate to Table', exact: true }) })
    .first()
  await expect(projectCard).toBeVisible({ timeout: 10000 })
  await projectCard.getByRole('button', { name: 'Activate to Table', exact: true }).click()

  await expect(page.getByText('Activate Initiative Project')).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Activate to Table', exact: true }).last().click()
  await page.waitForTimeout(800)
}

const placeProjectOnMap = async (
  page: Page,
  panel: Locator,
  canvas: Locator,
  projectNameMatcher: RegExp
) => {
  const projectButton = panel.getByRole('button', { name: projectNameMatcher }).first()
  const placementMode = panel.getByText('Placement mode')
  const isStillUnplaced = async () => (await projectButton.count()) > 0
  const target = await getHexCenterRatios(canvas, 1, 0)
  const candidates: Array<[number, number]> = [
    [target.x, target.y],
    [target.x + 0.02, target.y],
    [target.x - 0.02, target.y],
    [target.x, target.y + 0.02],
    [target.x, target.y - 0.02],
    [target.x + 0.03, target.y + 0.02],
    [target.x - 0.03, target.y - 0.02],
  ]

  for (const [x, y] of candidates) {
    await clickCanvasAtNormalizedPoint(page, canvas, x, y)
    await page.waitForTimeout(350)
    if (!(await isStillUnplaced())) {
      return { x, y }
    }

    // Placement is canceled on canvas misses; restart and continue searching.
    if ((await placementMode.count()) === 0 && (await isStillUnplaced())) {
      await projectButton.click()
      await expect(placementMode).toBeVisible()
    }
  }

  throw new Error('Could not place project on any expected open hex candidate')
}

const selectPlacedTile = async (
  page: Page,
  panel: Locator,
  canvas: Locator,
  basePoint: { x: number; y: number }
) => {
  const removeButton = panel.getByRole('button', { name: 'Remove from map' })
  const selectionHint = panel.getByText('Click a placed hex tile on the map to select it.')
  const selectionTrigger = panel.getByRole('button', { name: 'Select placed tile' })
  const focusedCandidates: Array<[number, number]> = [
    [basePoint.x, basePoint.y],
    [basePoint.x + 0.015, basePoint.y],
    [basePoint.x - 0.015, basePoint.y],
    [basePoint.x, basePoint.y + 0.015],
    [basePoint.x, basePoint.y - 0.015],
    [basePoint.x + 0.03, basePoint.y + 0.015],
    [basePoint.x - 0.03, basePoint.y - 0.015],
  ]
  const broadCandidates: Array<[number, number]> = []
  for (const y of [0.28, 0.36, 0.44, 0.52, 0.6, 0.68]) {
    for (const x of [0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68]) {
      broadCandidates.push([x, y])
    }
  }
  const candidates = [...focusedCandidates, ...broadCandidates]

  for (const [x, y] of candidates) {
    if ((await removeButton.count()) > 0) {
      return
    }

    // Selection mode is canceled on misses; re-enter it when needed.
    if ((await selectionHint.count()) === 0 && (await selectionTrigger.count()) > 0) {
      await selectionTrigger.click()
      await expect(selectionHint).toBeVisible()
    }

    try {
      await clickCanvasAtNormalizedPoint(page, canvas, x, y)
    } catch {
      // If a tile click navigated to a project room, recover back to Life Map and continue.
      if (!new URL(page.url()).pathname.startsWith('/life-map')) {
        await page.getByRole('link', { name: 'Life Map' }).click()
        await waitForLiveStoreReady(page)
      }
      continue
    }
    await page.waitForTimeout(300)

    if (!new URL(page.url()).pathname.startsWith('/life-map')) {
      await page.getByRole('link', { name: 'Life Map' }).click()
      await waitForLiveStoreReady(page)
      continue
    }

    if ((await removeButton.count()) > 0) {
      return
    }
  }

  throw new Error('Could not select a placed tile from expected map coordinates')
}

test.describe('Life Map placement tray flow', () => {
  test.describe.configure({ timeout: 180000 })

  test('places and removes a project from the map using the unplaced tray', async ({ page }) => {
    const storeId = await navigateToAppWithUniqueStore(page)
    const projectName = `Placement Project ${Date.now()}`
    const projectNameMatcher = new RegExp(escapeRegExp(projectName))

    await createInitiativeProject(page, storeId, projectName)
    await activateInitiativeProject(page, projectName)

    await page.getByRole('link', { name: 'Life Map' }).click()
    await waitForLiveStoreReady(page)

    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10000 })

    const panel = page.locator('aside').filter({ hasText: 'Unplaced Projects' }).first()
    await expect(panel).toBeVisible({ timeout: 10000 })

    const firstRunPrompt = page.getByText('Your projects are ready to place')
    if (await firstRunPrompt.isVisible()) {
      await page.getByRole('button', { name: 'Dismiss' }).click()
      await expect(firstRunPrompt).toHaveCount(0)
    }

    const projectButton = panel.getByRole('button', { name: projectNameMatcher }).first()
    await expect(projectButton).toBeVisible()
    await projectButton.click()

    await expect(panel.getByText('Placement mode')).toBeVisible()
    await expect(panel.getByText('Click an empty highlighted hex.')).toBeVisible()

    await clickCanvasAtNormalizedPoint(page, canvas, 0.5, 0.5)
    if ((await panel.getByText('Placement mode').count()) === 0) {
      await projectButton.click()
    }
    await expect(panel.getByText('Placement mode')).toBeVisible()

    const placedPoint = await placeProjectOnMap(page, panel, canvas, projectNameMatcher)
    await expect(panel.getByText('Placement mode')).toHaveCount(0)
    await expect(panel.getByRole('button', { name: projectNameMatcher })).toHaveCount(0)

    await panel.getByRole('button', { name: 'Select placed tile' }).click()
    await expect(panel.getByText('Click a placed hex tile on the map to select it.')).toBeVisible()

    await selectPlacedTile(page, panel, canvas, placedPoint)
    await expect(panel.getByRole('button', { name: 'Remove from map' })).toBeVisible()
    await panel.getByRole('button', { name: 'Remove from map' }).click()

    await expect(panel.getByRole('button', { name: 'Remove from map' })).toHaveCount(0, {
      timeout: 15000,
    })
    await expect(panel.getByRole('button', { name: projectNameMatcher }).first()).toBeVisible({
      timeout: 15000,
    })
  })

  test('keeps map visible after project placement when remote text resources are unavailable', async ({
    page,
  }) => {
    await blockRemoteTextFontRequests(page)

    const storeId = await navigateToAppWithUniqueStore(page)
    const projectName = `Placement Offline Font Project ${Date.now()}`
    const projectNameMatcher = new RegExp(escapeRegExp(projectName))

    await createInitiativeProject(page, storeId, projectName)
    await activateInitiativeProject(page, projectName)

    await page.getByRole('link', { name: 'Life Map' }).click()
    await waitForLiveStoreReady(page)

    let canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10000 })

    const panel = page.locator('aside').filter({ hasText: 'Unplaced Projects' }).first()
    await expect(panel).toBeVisible({ timeout: 10000 })

    const firstRunPrompt = page.getByText('Your projects are ready to place')
    if (await firstRunPrompt.isVisible()) {
      await page.getByRole('button', { name: 'Dismiss' }).click()
      await expect(firstRunPrompt).toHaveCount(0)
    }

    const projectButton = panel.getByRole('button', { name: projectNameMatcher }).first()
    await expect(projectButton).toBeVisible()
    await projectButton.click()
    await expect(panel.getByText('Placement mode')).toBeVisible()

    const placedPoint = await placeProjectOnMap(page, panel, canvas, projectNameMatcher)
    await expect(panel.getByRole('button', { name: projectNameMatcher })).toHaveCount(0)
    await expect(canvas).toBeVisible()

    await page.reload()
    await waitForLiveStoreReady(page)

    canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible({ timeout: 10000 })

    const reloadedPanel = page.locator('aside').filter({ hasText: 'Unplaced Projects' }).first()
    await expect(reloadedPanel).toBeVisible({ timeout: 10000 })
    await expect(reloadedPanel.getByRole('button', { name: projectNameMatcher })).toHaveCount(0)
    await expect(reloadedPanel.getByText('0 waiting for placement')).toBeVisible()
  })
})
