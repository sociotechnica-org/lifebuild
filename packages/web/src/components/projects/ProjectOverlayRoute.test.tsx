import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { fireEvent, render, screen } from '../../../tests/test-utils.js'
import { ProjectOverlayRoute, resolveMapOverlayCloseAction } from './ProjectOverlayRoute.js'

vi.mock('./ProjectDetailPage.js', () => ({
  ProjectDetailPage: () => <div>Project overlay content</div>,
}))

const LocationProbe: React.FC = () => {
  const location = useLocation()
  return <div data-testid='location-probe'>{`${location.pathname}${location.search}`}</div>
}

describe('resolveMapOverlayCloseAction', () => {
  it('uses history back only when opened from map and there is browser history', () => {
    expect(
      resolveMapOverlayCloseAction({ openedFromMap: true, historyLength: 2, search: '?storeId=1' })
    ).toEqual({ type: 'back' })

    expect(
      resolveMapOverlayCloseAction({ openedFromMap: true, historyLength: 1, search: '?storeId=1' })
    ).toEqual({ type: 'home', search: '?storeId=1' })

    expect(
      resolveMapOverlayCloseAction({
        openedFromMap: false,
        historyLength: 3,
        search: '?storeId=1',
      })
    ).toEqual({ type: 'home', search: '?storeId=1' })
  })
})

describe('ProjectOverlayRoute', () => {
  it('closes to map home when deep linked', () => {
    render(
      <MemoryRouter initialEntries={['/projects/project-1?storeId=test-store']}>
        <Routes>
          <Route
            path='/'
            element={
              <>
                <div>Map page</div>
                <LocationProbe />
              </>
            }
          />
          <Route
            path='/projects/:projectId'
            element={
              <>
                <ProjectOverlayRoute />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Project overlay content')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('building-overlay-close'))

    expect(screen.getByText('Map page')).toBeInTheDocument()
    expect(screen.getByTestId('location-probe')).toHaveTextContent('/?storeId=test-store')
  })
})
