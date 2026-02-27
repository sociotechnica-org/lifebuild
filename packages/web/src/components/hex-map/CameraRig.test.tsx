import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OrthographicCamera } from 'three'
import { render } from '../../../tests/test-utils.js'
import { CameraRig } from './CameraRig.js'

const { useThreeMock, useFrameMock } = vi.hoisted(() => ({
  useThreeMock: vi.fn(),
  useFrameMock: vi.fn(),
}))

vi.mock('@react-three/fiber', () => ({
  useThree: () => useThreeMock(),
  useFrame: (callback: (state: unknown, delta: number) => void) => useFrameMock(callback),
}))

describe('CameraRig', () => {
  let camera: OrthographicCamera
  let canvas: HTMLCanvasElement
  let frameCallback: ((state: unknown, delta: number) => void) | undefined

  const runFrame = (delta = 1 / 60) => {
    if (!frameCallback) {
      throw new Error('Expected useFrame callback to be registered')
    }
    frameCallback({}, delta)
  }

  beforeEach(() => {
    camera = new OrthographicCamera()
    canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    frameCallback = undefined

    useFrameMock.mockReset()
    useFrameMock.mockImplementation((callback: (state: unknown, delta: number) => void) => {
      frameCallback = callback
    })

    useThreeMock.mockReset()
    useThreeMock.mockReturnValue({
      camera,
      size: { width: 1200, height: 800 },
      gl: { domElement: canvas },
    })
  })

  afterEach(() => {
    canvas.remove()
    vi.restoreAllMocks()
  })

  it('zooms with wheel input and clamps min/max bounds', () => {
    render(<CameraRig />)

    runFrame()
    expect(camera.top).toBeCloseTo(8, 5)

    const zoomInEvent = new WheelEvent('wheel', { deltaY: -200, bubbles: true, cancelable: true })
    canvas.dispatchEvent(zoomInEvent)
    expect(zoomInEvent.defaultPrevented).toBe(true)
    runFrame()
    expect(camera.top).toBeCloseTo(4, 5)

    const zoomOutEvent = new WheelEvent('wheel', { deltaY: 5000, bubbles: true, cancelable: true })
    canvas.dispatchEvent(zoomOutEvent)
    expect(zoomOutEvent.defaultPrevented).toBe(true)
    runFrame()
    expect(camera.top).toBeCloseTo(24, 5)
  })

  it('pans camera while arrow keys are pressed', () => {
    render(<CameraRig />)

    runFrame()
    expect(camera.position.x).toBeCloseTo(0, 5)

    const keyDownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowRight',
      bubbles: true,
      cancelable: true,
    })
    window.dispatchEvent(keyDownEvent)
    expect(keyDownEvent.defaultPrevented).toBe(true)

    runFrame(0.5)
    expect(camera.position.x).toBeCloseTo(6, 5)

    window.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowRight', bubbles: true }))
    const xAfterKeyUp = camera.position.x
    runFrame(0.5)
    expect(camera.position.x).toBeCloseTo(xAfterKeyUp, 5)
  })

  it('ignores arrow-key capture when typing in editable elements', () => {
    render(<CameraRig />)

    runFrame()

    const input = document.createElement('input')
    document.body.appendChild(input)
    const keyDownEvent = new KeyboardEvent('keydown', {
      key: 'ArrowLeft',
      bubbles: true,
      cancelable: true,
    })
    input.dispatchEvent(keyDownEvent)
    expect(keyDownEvent.defaultPrevented).toBe(false)

    runFrame(0.5)
    expect(camera.position.x).toBeCloseTo(0, 5)
    input.remove()
  })

  it('clears pressed keys on blur and removes listeners on unmount', () => {
    const windowAddEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const windowRemoveEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const canvasAddEventListenerSpy = vi.spyOn(canvas, 'addEventListener')
    const canvasRemoveEventListenerSpy = vi.spyOn(canvas, 'removeEventListener')

    const { unmount } = render(<CameraRig />)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    runFrame(0.25)
    const xAfterKeyDown = camera.position.x
    expect(xAfterKeyDown).toBeGreaterThan(0)

    window.dispatchEvent(new Event('blur'))
    runFrame(0.25)
    expect(camera.position.x).toBeCloseTo(xAfterKeyDown, 5)

    expect(windowAddEventListenerSpy.mock.calls.some(call => call[0] === 'keydown')).toBe(true)
    expect(windowAddEventListenerSpy.mock.calls.some(call => call[0] === 'keyup')).toBe(true)
    expect(windowAddEventListenerSpy.mock.calls.some(call => call[0] === 'blur')).toBe(true)
    expect(
      canvasAddEventListenerSpy.mock.calls.some(
        call =>
          call[0] === 'wheel' &&
          typeof call[1] === 'function' &&
          typeof call[2] === 'object' &&
          call[2] !== null &&
          'passive' in call[2] &&
          call[2].passive === false
      )
    ).toBe(true)

    unmount()

    expect(windowRemoveEventListenerSpy.mock.calls.some(call => call[0] === 'keydown')).toBe(true)
    expect(windowRemoveEventListenerSpy.mock.calls.some(call => call[0] === 'keyup')).toBe(true)
    expect(windowRemoveEventListenerSpy.mock.calls.some(call => call[0] === 'blur')).toBe(true)
    expect(canvasRemoveEventListenerSpy.mock.calls.some(call => call[0] === 'wheel')).toBe(true)
  })
})
