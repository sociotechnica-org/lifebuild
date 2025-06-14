import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TaskModal } from '../../src/components/TaskModal.js'
import type { Task, User, Comment } from '../../src/livestore/schema.js'

// Mock LiveStore hooks
const mockCommit = vi.fn()
const mockStore = { commit: mockCommit }

vi.mock('@livestore/react', () => ({
  useQuery: vi.fn(),
  useStore: vi.fn(() => ({ store: mockStore })),
}))

// Import after mocking
import { useQuery } from '@livestore/react'

const mockUseQuery = useQuery as ReturnType<typeof vi.fn>

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => 'test-uuid'),
})

describe('TaskModal Comments', () => {
  const mockTask: Task = {
    id: 'task-1',
    boardId: 'board-1',
    columnId: 'column-1',
    title: 'Test Task',
    description: 'Test description',
    assigneeIds: '[]',
    position: 1,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    archivedAt: null,
  }

  const mockUsers: User[] = [
    {
      id: 'user-1',
      name: 'Alice Johnson',
      avatarUrl: null,
      createdAt: new Date('2023-01-01'),
    },
    {
      id: 'user-2',
      name: 'Bob Smith',
      avatarUrl: null,
      createdAt: new Date('2023-01-01'),
    },
  ]

  const mockColumns = [
    {
      id: 'column-1',
      boardId: 'board-1',
      name: 'To Do',
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  const mockComments: Comment[] = [
    {
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'This is a test comment',
      createdAt: new Date('2023-01-02'),
    },
    {
      id: 'comment-2',
      taskId: 'task-1',
      authorId: 'user-2',
      content: 'Another comment here',
      createdAt: new Date('2023-01-01'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation
    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) return [mockTask]
      if (query.label?.includes('getBoardColumns')) return mockColumns
      if (query.label?.includes('getUsers')) return mockUsers
      if (query.label?.includes('getTaskComments')) return mockComments
      return []
    })
  })

  it('should display comments count in header', () => {
    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    expect(screen.getByText('Comments (2)')).toBeInTheDocument()
  })

  it('should display comments in reverse chronological order', () => {
    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    const commentElements = screen.getAllByText(/This is a test comment|Another comment here/)

    // First comment should be the newer one (comment-1)
    expect(commentElements[0]).toHaveTextContent('This is a test comment')
    // Second comment should be the older one (comment-2)
    expect(commentElements[1]).toHaveTextContent('Another comment here')
  })

  it('should show comment author names and avatars', () => {
    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()

    // Check for avatar initials (use getAllByText since AJ appears twice - composer and comment)
    const ajElements = screen.getAllByText('AJ')
    expect(ajElements.length).toBe(2) // one in composer, one in comment
    expect(screen.getByText('BS')).toBeInTheDocument()
  })

  it('should show comment composer when user is available', () => {
    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    expect(screen.getByPlaceholderText('Add a comment...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Comment' })).toBeInTheDocument()
  })

  it('should validate comment content', async () => {
    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    const textarea = screen.getByPlaceholderText('Add a comment...')
    const submitButton = screen.getByRole('button', { name: 'Comment' })

    // Button should be disabled when empty
    expect(submitButton).toBeDisabled()

    // Type whitespace only - button should still be disabled
    fireEvent.change(textarea, { target: { value: '   ' } })
    expect(submitButton).toBeDisabled()

    // Test max length validation
    const longText = 'x'.repeat(5001)
    fireEvent.change(textarea, { target: { value: longText } })

    // Button should be enabled for long text, but clicking should show error
    expect(submitButton).toBeEnabled()
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Comment cannot exceed 5000 characters')).toBeInTheDocument()
    })
  })

  it('should submit comment when valid content is provided', async () => {
    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    const textarea = screen.getByPlaceholderText('Add a comment...')
    const submitButton = screen.getByRole('button', { name: 'Comment' })

    fireEvent.change(textarea, { target: { value: 'This is a new comment' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'v1.CommentAdded',
        })
      )
    })

    // Check the call was made with correct parameters
    const call = mockCommit.mock.calls[0]?.[0]
    expect(call?.args.id).toBe('test-uuid')
    expect(call?.args.taskId).toBe('task-1')
    expect(call?.args.authorId).toBe('user-1')
    expect(call?.args.content).toBe('This is a new comment')
    expect(call?.args.createdAt).toBeInstanceOf(Date)

    // Form should be cleared after submission
    expect(textarea).toHaveValue('')
  })

  it('should submit comment with Cmd+Enter keyboard shortcut', async () => {
    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    const textarea = screen.getByPlaceholderText('Add a comment...')

    fireEvent.change(textarea, { target: { value: 'Keyboard shortcut comment' } })
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })

    await waitFor(() => {
      expect(mockCommit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'v1.CommentAdded',
        })
      )
    })

    // Check the call was made with correct parameters
    const call = mockCommit.mock.calls[0]?.[0]
    expect(call?.args.content).toBe('Keyboard shortcut comment')
  })

  it('should show character count', () => {
    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    const textarea = screen.getByPlaceholderText('Add a comment...')

    // Initially shows 0/5000
    expect(screen.getByText('0/5000 • Cmd+Enter to post')).toBeInTheDocument()

    fireEvent.change(textarea, { target: { value: 'Hello' } })

    expect(screen.getByText('5/5000 • Cmd+Enter to post')).toBeInTheDocument()
  })

  it('should show empty state when no comments exist', () => {
    // Mock empty comments
    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) return [mockTask]
      if (query.label?.includes('getBoardColumns')) return mockColumns
      if (query.label?.includes('getUsers')) return mockUsers
      if (query.label?.includes('getTaskComments')) return []
      return []
    })

    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    expect(screen.getByText('Comments (0)')).toBeInTheDocument()
    // Comments section should be empty when no comments exist (no empty state message)
  })

  it('should handle unknown user gracefully', () => {
    const commentsWithUnknownUser: Comment[] = [
      {
        id: 'comment-1',
        taskId: 'task-1',
        authorId: 'unknown-user',
        content: 'Comment from unknown user',
        createdAt: new Date('2023-01-01'),
      },
    ]

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) return [mockTask]
      if (query.label?.includes('getBoardColumns')) return mockColumns
      if (query.label?.includes('getUsers')) return mockUsers
      if (query.label?.includes('getTaskComments')) return commentsWithUnknownUser
      return []
    })

    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    expect(screen.getByText('Unknown User')).toBeInTheDocument()
    expect(screen.getByText('UU')).toBeInTheDocument() // fallback initials from getInitials
  })
})
