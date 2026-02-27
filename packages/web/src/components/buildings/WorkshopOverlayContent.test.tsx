import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { WorkshopOverlayContent } from './WorkshopOverlayContent.js'

describe('WorkshopOverlayContent', () => {
  it('renders unplaced projects with place actions', () => {
    const onPlaceOnMap = vi.fn()

    render(
      <WorkshopOverlayContent
        unplacedProjects={[
          { id: 'project-1', name: 'Project One', category: 'growth' },
          { id: 'project-2', name: 'Project Two', category: null },
        ]}
        onPlaceOnMap={onPlaceOnMap}
      />
    )

    expect(screen.getByRole('heading', { name: 'Workshop' })).toBeInTheDocument()
    expect(screen.getByTestId('workshop-unplaced-project-list')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('workshop-place-project-project-2'))

    expect(onPlaceOnMap).toHaveBeenCalledTimes(1)
    expect(onPlaceOnMap).toHaveBeenCalledWith('project-2')
  })

  it('renders empty state when there are no unplaced projects', () => {
    render(<WorkshopOverlayContent />)

    expect(screen.getByTestId('workshop-empty-unplaced-projects')).toBeInTheDocument()
    expect(screen.getByText('No unplaced projects right now.')).toBeInTheDocument()
  })
})
