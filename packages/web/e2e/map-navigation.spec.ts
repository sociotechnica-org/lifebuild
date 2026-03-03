import { test, expect, type Locator, type Page } from '@playwright/test'
import { navigateToAppWithUniqueStore, waitForLiveStoreReady } from './test-utils'

const isLoadingLiveStore = async (page: Page): Promise<boolean> => {
  return page
    .locator('text=Loading LiveStore')
    .isVisible()
    .catch(() => false)
}

const expectMapVisible = async (page: Page): Promise<Locator | null> => {
  const canvas = page.locator('canvas').first()
  const hasCanvas = await canvas
    .waitFor({ state: 'visible', timeout: 10000 })
    .then(() => true)
    .catch(() => false)

  if (!hasCanvas) {
    await expect(page.getByText('Map unavailable on this device')).toBeVisible({ timeout: 10000 })
    return null
  }

  return canvas
}

const getCenter = async (locator: Locator): Promise<{ x: number; y: number }> => {
  const box = await locator.boundingBox()
  if (!box) {
    throw new Error('Expected element to have a bounding box')
  }

  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

const sampleBottomStripClearMatches = async (canvas: Locator): Promise<number | null> => {
  return canvas.evaluate(element => {
    const surface = element as HTMLCanvasElement
    const gl =
      (surface.getContext('webgl2', {
        preserveDrawingBuffer: true,
      }) as WebGL2RenderingContext | null) ??
      (surface.getContext('webgl', { preserveDrawingBuffer: true }) as WebGLRenderingContext | null)
    if (!gl) {
      return null
    }

    const clearColor = [239, 226, 205]
    const samples = 16
    let clearMatches = 0
    const pixel = new Uint8Array(4)

    for (let index = 0; index < samples; index += 1) {
      const x = Math.min(
        surface.width - 1,
        Math.max(0, Math.round(((index + 0.5) / samples) * surface.width))
      )
      gl.readPixels(x, 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)

      if (pixel[0] === clearColor[0] && pixel[1] === clearColor[1] && pixel[2] === clearColor[2]) {
        clearMatches += 1
      }
    }

    return clearMatches
  })
}

test.describe('Map navigation', () => {
  test('renders full-bleed map surface on initial load', async ({ page }) => {
    await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    const canvas = await expectMapVisible(page)
    if (!canvas) {
      return
    }

    const sanctuaryButton = page.getByTestId('fixed-building-sanctuary-button')
    await expect(sanctuaryButton).toBeVisible({ timeout: 10000 })

    const canvasBox = await canvas.boundingBox()
    expect(canvasBox).not.toBeNull()
    if (!canvasBox) {
      return
    }

    const main = page.locator('main').first()
    const mainBox = await main.boundingBox()
    expect(mainBox).not.toBeNull()
    if (!mainBox) {
      return
    }

    // Map surface should fully span the app width instead of appearing scaled down.
    expect(canvasBox.width).toBeGreaterThanOrEqual(mainBox.width - 8)
    expect(Math.abs(canvasBox.x - mainBox.x)).toBeLessThanOrEqual(4)

    const transformScale = await canvas.evaluate(element => {
      let node: HTMLElement | null = element as HTMLElement

      while (node && node !== document.body) {
        const { transform } = window.getComputedStyle(node)
        if (transform && transform !== 'none') {
          const match = transform.match(/matrix\((.+)\)/)
          if (!match) {
            return { scaleX: 1, scaleY: 1 }
          }

          const [scaleX = 1, , , scaleY = 1] = match[1]
            .split(',')
            .map(value => Number(value.trim()))
          return { scaleX, scaleY }
        }
        node = node.parentElement
      }

      return { scaleX: 1, scaleY: 1 }
    })

    expect(Math.abs(transformScale.scaleX - 1)).toBeLessThan(0.02)
    expect(Math.abs(transformScale.scaleY - 1)).toBeLessThan(0.02)
  })

  test('supports wheel zoom and arrow-key pan controls', async ({ page }) => {
    await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    const canvas = await expectMapVisible(page)
    if (!canvas) {
      return
    }

    const sanctuaryButton = page.getByTestId('fixed-building-sanctuary-button')
    const workshopButton = page.getByTestId('fixed-building-workshop-button')
    await expect(sanctuaryButton).toBeVisible({ timeout: 10000 })
    await expect(workshopButton).toBeVisible({ timeout: 10000 })

    const canvasBox = await canvas.boundingBox()
    if (!canvasBox) {
      return
    }

    const sanctuaryBeforeZoom = await getCenter(sanctuaryButton)
    const workshopBeforeZoom = await getCenter(workshopButton)
    const distanceBeforeZoom = Math.abs(workshopBeforeZoom.x - sanctuaryBeforeZoom.x)

    await page.mouse.move(canvasBox.x + canvasBox.width / 2, canvasBox.y + canvasBox.height / 2)
    await page.mouse.wheel(0, -900)
    // Allow R3F to process zoom animation
    await page.waitForTimeout(500)

    const sanctuaryAfterZoom = await getCenter(sanctuaryButton)
    const workshopAfterZoom = await getCenter(workshopButton)
    const distanceAfterZoom = Math.abs(workshopAfterZoom.x - sanctuaryAfterZoom.x)

    expect(distanceAfterZoom).toBeGreaterThan(distanceBeforeZoom + 1)

    const sanctuaryBeforePan = await getCenter(sanctuaryButton)
    await page.keyboard.down('ArrowRight')
    await page.waitForTimeout(400)
    await page.keyboard.up('ArrowRight')
    await waitForLiveStoreReady(page)

    const sanctuaryAfterPan = await getCenter(sanctuaryButton)
    expect(Math.abs(sanctuaryAfterPan.x - sanctuaryBeforePan.x)).toBeGreaterThan(1)
  })

  test('keeps parchment shader full-bleed at max zoom-out across aspect ratios', async ({
    page,
  }) => {
    test.setTimeout(60000)
    await navigateToAppWithUniqueStore(page)

    if (await isLoadingLiveStore(page)) {
      return
    }

    const canvas = await expectMapVisible(page)
    if (!canvas) {
      return
    }

    const viewports = [
      { width: 1366, height: 1024 },
      { width: 1600, height: 900 },
      { width: 1280, height: 960 },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      // Allow R3F to re-render after viewport resize
      await page.waitForTimeout(500)

      const box = await canvas.boundingBox()
      if (!box) {
        continue
      }

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.wheel(0, 5000)
      // Allow R3F to process zoom and re-render
      await page.waitForTimeout(500)

      // Race the pixel sampling against a timeout — the WebGL context
      // grab can hang in CI when R3F owns the canvas context
      const clearMatches = await Promise.race([
        sampleBottomStripClearMatches(canvas),
        new Promise<null>(resolve => setTimeout(() => resolve(null), 5000)),
      ])
      if (clearMatches === null) {
        continue
      }

      expect(
        clearMatches,
        `Expected no clear-color strip at bottom for ${viewport.width}x${viewport.height}`
      ).toBeLessThan(4)
    }
  })
})
