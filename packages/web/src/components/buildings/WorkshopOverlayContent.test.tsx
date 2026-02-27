import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '../../../tests/test-utils.js'
import { WorkshopOverlayContent } from './WorkshopOverlayContent.js'

describe('WorkshopOverlayContent', () => {
  it('renders a coming soon sign for workshop drafting', () => {
    render(<WorkshopOverlayContent />)

    expect(screen.getByRole('heading', { name: 'Workshop' })).toBeInTheDocument()
    expect(screen.getByTestId('workshop-coming-soon-sign')).toBeInTheDocument()
    expect(screen.getByText('Drafting in the Workshop is under construction.')).toBeInTheDocument()
  })
})
