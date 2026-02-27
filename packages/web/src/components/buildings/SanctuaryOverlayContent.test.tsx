import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '../../../tests/test-utils.js'
import { SanctuaryOverlayContent } from './SanctuaryOverlayContent.js'

describe('SanctuaryOverlayContent', () => {
  it('renders the charter placeholder for sanctuary visioning', () => {
    render(<SanctuaryOverlayContent />)

    expect(screen.getByRole('heading', { name: 'Sanctuary' })).toBeInTheDocument()
    expect(screen.getByTestId('sanctuary-charter-placeholder')).toBeInTheDocument()
    expect(screen.getByText('Visioning in the Sanctuary is coming soon.')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Jarvis is ready in the Attendant Rail while we build the guided charter space for the Builder.'
      )
    ).toBeInTheDocument()
  })
})
