import React from 'react'
import { render, screen } from '@testing-library/react'
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

describe('TaskModal Markdown Rendering', () => {
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
  }

  const mockUsers: User[] = [
    {
      id: 'user-1',
      name: 'Alice Johnson',
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

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render markdown in comments', () => {
    const markdownComment: Comment = {
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'This is **bold** and *italic* text with a [link](https://example.com)',
      createdAt: new Date('2023-01-01'),
    }

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) return [mockTask]
      if (query.label?.includes('getBoardColumns')) return mockColumns
      if (query.label?.includes('getUsers')) return mockUsers
      if (query.label?.includes('getTaskComments')) return [markdownComment]
      return []
    })

    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    // The markdown should be rendered as HTML
    const commentElement = screen.getByText('Alice Johnson').parentElement?.parentElement
    expect(commentElement).toBeInTheDocument()

    // Check that the comment content contains the raw text (since we can't easily check rendered HTML)
    expect(commentElement).toHaveTextContent('This is bold and italic text with a link')
  })

  it('should render line breaks in comments', () => {
    const multilineComment: Comment = {
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'Line 1\nLine 2\n\nLine 4 after blank line',
      createdAt: new Date('2023-01-01'),
    }

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) return [mockTask]
      if (query.label?.includes('getBoardColumns')) return mockColumns
      if (query.label?.includes('getUsers')) return mockUsers
      if (query.label?.includes('getTaskComments')) return [multilineComment]
      return []
    })

    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    // Check that multiline content is preserved (including author name and date)
    const commentElement = screen.getByText('Alice Johnson').parentElement?.parentElement
    expect(commentElement).toHaveTextContent(
      'Alice JohnsonDec 31, 2022, 7:00 PMLine 1Line 2 Line 4 after blank line'
    )
  })

  it('should sanitize potentially dangerous HTML', () => {
    const dangerousComment: Comment = {
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'user-1',
      content: 'Safe text <script>alert("xss")</script> more text',
      createdAt: new Date('2023-01-01'),
    }

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) return [mockTask]
      if (query.label?.includes('getBoardColumns')) return mockColumns
      if (query.label?.includes('getUsers')) return mockUsers
      if (query.label?.includes('getTaskComments')) return [dangerousComment]
      return []
    })

    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    // The script tag should be removed by DOMPurify
    const commentElement = screen.getByText('Alice Johnson').parentElement?.parentElement
    expect(commentElement).toHaveTextContent(
      'Alice JohnsonDec 31, 2022, 7:00 PMSafe text more text'
    )
    expect(commentElement?.innerHTML).not.toContain('<script>')
  })

  it('should handle lists and code blocks', () => {
    const listAndCodeComment: Comment = {
      id: 'comment-1',
      taskId: 'task-1',
      authorId: 'user-1',
      content: '- Item 1\n- Item 2\n\n`inline code` and:\n\n```\ncode block\n```',
      createdAt: new Date('2023-01-01'),
    }

    mockUseQuery.mockImplementation((query: any) => {
      if (query.label?.includes('getTaskById')) return [mockTask]
      if (query.label?.includes('getBoardColumns')) return mockColumns
      if (query.label?.includes('getUsers')) return mockUsers
      if (query.label?.includes('getTaskComments')) return [listAndCodeComment]
      return []
    })

    render(<TaskModal taskId='task-1' onClose={() => {}} />)

    // Check that the content includes list and code elements
    const commentElement = screen.getByText('Alice Johnson').parentElement?.parentElement
    expect(commentElement).toHaveTextContent('Item 1 Item 2 inline code')
  })
})
