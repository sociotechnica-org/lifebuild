import type { Store } from '@livestore/livestore'
import { events } from '../livestore/schema.js'

export function seedSampleBoards(store: Store) {
  const now = new Date()

  // Create sample users
  const sampleUsers = [
    {
      id: 'user-1',
      name: 'Alice Johnson',
      avatarUrl: undefined,
      createdAt: new Date(now.getTime() - 604800000), // 1 week ago
    },
    {
      id: 'user-2',
      name: 'Bob Smith',
      avatarUrl: undefined,
      createdAt: new Date(now.getTime() - 518400000), // 6 days ago
    },
    {
      id: 'user-3',
      name: 'Carol Davis',
      avatarUrl: undefined,
      createdAt: new Date(now.getTime() - 432000000), // 5 days ago
    },
    {
      id: 'user-4',
      name: 'David Wilson',
      avatarUrl: undefined,
      createdAt: new Date(now.getTime() - 345600000), // 4 days ago
    },
  ]

  // Commit user creation events
  sampleUsers.forEach(user => {
    store.commit(events.userCreated(user))
  })

  // Create sample boards
  const sampleBoards = [
    {
      id: 'board-1',
      name: 'Project Alpha',
      createdAt: new Date(now.getTime() - 86400000), // 1 day ago
    },
    {
      id: 'board-2',
      name: 'Marketing Campaign',
      createdAt: new Date(now.getTime() - 172800000), // 2 days ago
    },
    {
      id: 'board-3',
      name: 'Product Roadmap',
      createdAt: new Date(now.getTime() - 259200000), // 3 days ago
    },
  ]

  // Create default columns for each board
  const defaultColumns = [
    { name: 'Todo', position: 0 },
    { name: 'Doing', position: 1 },
    { name: 'In Review', position: 2 },
    { name: 'Done', position: 3 },
  ]

  // Sample tasks for each column
  const sampleTasks = {
    0: ['Research user requirements', 'Design wireframes', 'Set up development environment'],
    1: ['Implement authentication system', 'Create dashboard layout', 'Write API endpoints'],
    2: ['Review code for security issues', 'Test user flows', 'Update documentation'],
    3: ['Deploy to staging environment', 'Fix minor UI bugs', 'Update user guide'],
  }

  // Commit board creation events
  sampleBoards.forEach(board => {
    store.commit(events.boardCreated(board))

    // Create columns for this board
    defaultColumns.forEach(column => {
      const columnId = `${board.id}-col-${column.position}`
      store.commit(
        events.columnCreated({
          id: columnId,
          boardId: board.id,
          name: column.name,
          position: column.position,
          createdAt: board.createdAt,
        })
      )

      // Create tasks for this column
      sampleTasks[column.position as keyof typeof sampleTasks].forEach((title, index) => {
        const taskId = `${columnId}-task-${index}`

        // Create the task
        store.commit(
          events.taskCreated({
            id: taskId,
            boardId: board.id,
            columnId: columnId,
            title: title,
            description: undefined,
            assigneeIds: undefined,
            position: index,
            createdAt: new Date(board.createdAt.getTime() + index * 1000), // Stagger creation times
          })
        )

        // Add some sample assignments (randomly assign 0-2 users to each task)
        const numAssignees = Math.floor(Math.random() * 3) // 0, 1, or 2 assignees
        if (numAssignees > 0) {
          const shuffledUsers = [...sampleUsers].sort(() => Math.random() - 0.5)
          const assigneeIds = shuffledUsers.slice(0, numAssignees).map(user => user.id)

          store.commit(
            events.taskUpdated({
              taskId,
              title: undefined,
              description: undefined,
              assigneeIds,
              updatedAt: new Date(board.createdAt.getTime() + index * 1000 + 500),
            })
          )
        }
      })
    })
  })
}
