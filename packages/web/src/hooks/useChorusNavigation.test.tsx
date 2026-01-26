import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

// Mock the dependencies
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockNavigateToFile = vi.fn()
vi.mock('./useFileNavigation.js', () => ({
  useFileNavigation: () => ({ navigateToFile: mockNavigateToFile }),
}))

const mockStore = {
  query: vi.fn(),
}
vi.mock('../livestore-compat.js', () => ({
  useStore: () => ({ store: mockStore }),
}))

// Import after mocks are set up
import { useChorusNavigation } from './useChorusNavigation.js'

describe('useChorusNavigation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location.search for preserveStoreIdInUrl
    Object.defineProperty(window, 'location', {
      value: { search: '?storeId=test-store-123' },
      writable: true,
    })
  })

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>{children}</BrowserRouter>
  )

  const createChorusElement = (path: string, text: string) => {
    const span = document.createElement('span')
    span.className = 'chorus-file-link'
    span.setAttribute('data-chorus', 'true')
    span.setAttribute('data-file-path', path)
    span.textContent = text
    document.body.appendChild(span)
    return span
  }

  const simulateClick = (element: HTMLElement) => {
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
    })
    element.dispatchEvent(event)
  }

  it('should navigate to project when clicking project: link', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    mockStore.query.mockResolvedValueOnce([
      {
        attributes: null,
        projectLifecycleState: { status: 'planning', stage: 1 },
      },
    ])
    const element = createChorusElement('project:abc123', 'View project')

    await act(async () => {
      simulateClick(element)
      // Allow async handlers to complete
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/drafting-room/abc123/stage1?storeId=test-store-123')

    document.body.removeChild(element)
  })

  it('should navigate to Project view when clicking project: link for non-planning projects', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    mockStore.query.mockResolvedValueOnce([
      {
        attributes: null,
        projectLifecycleState: { status: 'active', stage: 2 },
      },
    ])
    const element = createChorusElement('project:abc123', 'View project')

    await act(async () => {
      simulateClick(element)
      // Allow async handlers to complete
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).toHaveBeenCalledWith('/projects/abc123?storeId=test-store-123')

    document.body.removeChild(element)
  })

  it('should navigate to stage1 form when clicking drafting-stage1: link', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    const element = createChorusElement('drafting-stage1:proj-uuid', 'Start planning')

    await act(async () => {
      simulateClick(element)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      '/drafting-room/proj-uuid/stage1?storeId=test-store-123'
    )

    document.body.removeChild(element)
  })

  it('should navigate to stage2 form when clicking drafting-stage2: link', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    const element = createChorusElement('drafting-stage2:proj-uuid', 'Continue scoping')

    await act(async () => {
      simulateClick(element)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      '/drafting-room/proj-uuid/stage2?storeId=test-store-123'
    )

    document.body.removeChild(element)
  })

  it('should navigate to stage3 form when clicking drafting-stage3: link', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    const element = createChorusElement('drafting-stage3:proj-uuid', 'Detail project')

    await act(async () => {
      simulateClick(element)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      '/drafting-room/proj-uuid/stage3?storeId=test-store-123'
    )

    document.body.removeChild(element)
  })

  it('should handle UUID-style project IDs', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    const uuid = 'c18b2ef4-c77e-4862-8245-baca1537c81a'
    const element = createChorusElement(`drafting-stage1:${uuid}`, 'Start planning')

    await act(async () => {
      simulateClick(element)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).toHaveBeenCalledWith(
      `/drafting-room/${uuid}/stage1?storeId=test-store-123`
    )

    document.body.removeChild(element)
  })

  it('should not navigate when id is empty', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    const element = createChorusElement('drafting-stage1:', 'Invalid link')

    await act(async () => {
      simulateClick(element)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).not.toHaveBeenCalled()

    document.body.removeChild(element)
  })

  it('should not handle clicks on elements without data-chorus attribute', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    const span = document.createElement('span')
    span.className = 'chorus-file-link'
    // Note: not setting data-chorus="true"
    span.setAttribute('data-file-path', 'project:abc123')
    span.textContent = 'No chorus attr'
    document.body.appendChild(span)

    await act(async () => {
      simulateClick(span)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).not.toHaveBeenCalled()

    document.body.removeChild(span)
  })

  it('should allow CHORUS file paths with spaces when they look like filenames', async () => {
    renderHook(() => useChorusNavigation(), { wrapper })

    const element = createChorusElement('Meeting Notes.md', 'Meeting Notes.md')

    await act(async () => {
      simulateClick(element)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigateToFile).toHaveBeenCalledWith('Meeting Notes.md')

    document.body.removeChild(element)
  })

  it('should not navigate when path looks like display text (missing path attribute)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderHook(() => useChorusNavigation(), { wrapper })

    // This simulates what happens when AI generates <CHORUS_TAG>Start planning →</CHORUS_TAG>
    // without a path attribute - the inner content becomes the data-file-path
    const element = createChorusElement('Start planning →', 'Start planning →')

    await act(async () => {
      simulateClick(element)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[CHORUS] Invalid path'),
      'Start planning →',
      expect.any(String)
    )

    consoleSpy.mockRestore()
    document.body.removeChild(element)
  })

  it('should not navigate when path contains arrow characters', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderHook(() => useChorusNavigation(), { wrapper })

    const element = createChorusElement('View project →', 'View project')

    await act(async () => {
      simulateClick(element)
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
    document.body.removeChild(element)
  })
})
