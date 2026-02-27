import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { BuildingOverlay } from './BuildingOverlay.js'

describe('BuildingOverlay', () => {
  it('renders the overlay frame and content', () => {
    render(
      <BuildingOverlay title='Workshop' onClose={vi.fn()}>
        <div>Overlay content</div>
      </BuildingOverlay>
    )

    expect(screen.getByTestId('building-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('building-overlay-panel')).toBeInTheDocument()
    expect(screen.getByText('Overlay content')).toBeInTheDocument()
  })

  it('invokes close callback when backdrop is clicked', () => {
    const onClose = vi.fn()

    render(
      <BuildingOverlay title='Workshop' onClose={onClose}>
        <div>Overlay content</div>
      </BuildingOverlay>
    )

    fireEvent.click(screen.getByTestId('building-overlay-backdrop'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('invokes close callback when close button is clicked', () => {
    const onClose = vi.fn()

    render(
      <BuildingOverlay title='Workshop' onClose={onClose}>
        <div>Overlay content</div>
      </BuildingOverlay>
    )

    fireEvent.click(screen.getByTestId('building-overlay-close'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('invokes close callback when Escape is pressed', () => {
    const onClose = vi.fn()

    render(
      <BuildingOverlay title='Workshop' onClose={onClose}>
        <div>Overlay content</div>
      </BuildingOverlay>
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not close when clicking inside the panel content', () => {
    const onClose = vi.fn()

    render(
      <BuildingOverlay title='Workshop' onClose={onClose}>
        <button type='button'>Inner action</button>
      </BuildingOverlay>
    )

    fireEvent.click(screen.getByText('Inner action'))

    expect(onClose).not.toHaveBeenCalled()
  })
})
