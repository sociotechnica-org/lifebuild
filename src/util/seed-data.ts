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

  // Create sample projects
  const sampleProjects = [
    {
      id: 'project-1',
      name: 'Project Alpha',
      description: 'Main development project for our new product launch',
      createdAt: new Date(now.getTime() - 86400000), // 1 day ago
    },
    {
      id: 'project-2',
      name: 'Marketing Campaign',
      description: 'Q4 marketing campaign for product promotion',
      createdAt: new Date(now.getTime() - 172800000), // 2 days ago
    },
    {
      id: 'project-3',
      name: 'Product Roadmap',
      description: 'Long-term product strategy and feature planning',
      createdAt: new Date(now.getTime() - 259200000), // 3 days ago
    },
  ]

  // Create default columns for each project
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

  // Commit project creation events
  sampleProjects.forEach(project => {
    store.commit(events.projectCreated(project))

    // Create columns for this project
    defaultColumns.forEach(column => {
      const columnId = `${project.id}-col-${column.position}`
      store.commit(
        events.columnCreated({
          id: columnId,
          projectId: project.id,
          name: column.name,
          position: column.position,
          createdAt: project.createdAt,
        })
      )

      // Create tasks for this column
      sampleTasks[column.position as keyof typeof sampleTasks].forEach((title, index) => {
        const taskId = `${columnId}-task-${index}`

        // Create the task
        store.commit(
          events.taskCreated({
            id: taskId,
            projectId: project.id,
            columnId: columnId,
            title: title,
            description: undefined,
            assigneeIds: undefined,
            position: index,
            createdAt: new Date(project.createdAt.getTime() + index * 1000), // Stagger creation times
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
              updatedAt: new Date(project.createdAt.getTime() + index * 1000 + 500),
            })
          )
        }
      })
    })
  })
}

export async function seedSessionDocuments(store: Store) {
  const now = new Date()

  // Define the seed documents with their file names and metadata
  const seedDocuments = [
    {
      id: 'doc-ai-ethics-guide',
      title: 'AI Legal Ethics Guide',
      fileName: 'ai-legal-ethics-guide.md',
      createdAt: new Date(now.getTime() - 432000000), // 5 days ago
    },
    {
      id: 'doc-implementation-roadmap',
      title: 'AI Implementation Roadmap for Law Firms',
      fileName: 'ai-implementation-roadmap.md',
      createdAt: new Date(now.getTime() - 345600000), // 4 days ago
    },
    {
      id: 'doc-vendor-evaluation',
      title: 'AI Vendor Evaluation Checklist',
      fileName: 'ai-vendor-evaluation-checklist.md',
      createdAt: new Date(now.getTime() - 259200000), // 3 days ago
    },
    {
      id: 'doc-contract-review',
      title: 'AI Contract Review Best Practices',
      fileName: 'ai-contract-review-best-practices.md',
      createdAt: new Date(now.getTime() - 172800000), // 2 days ago
    },
    {
      id: 'doc-legal-research',
      title: 'AI Legal Research Strategies',
      fileName: 'ai-legal-research-strategies.md',
      createdAt: new Date(now.getTime() - 86400000), // 1 day ago
    },
  ]

  // Load document content from seed files
  for (const docMeta of seedDocuments) {
    try {
      // In a browser environment, we'll fetch the content from the public directory
      // Note: This requires the seed content files to be available via HTTP
      const response = await fetch(`/docs/seed-content/${docMeta.fileName}`)

      if (response.ok) {
        const content = await response.text()

        // Create the document using the DocumentCreated event
        store.commit(
          events.documentCreated({
            id: docMeta.id,
            title: docMeta.title,
            content: content,
            createdAt: docMeta.createdAt,
          })
        )

        console.log(`✅ Seeded document: ${docMeta.title}`)
      } else {
        console.warn(`⚠️ Could not load seed document: ${docMeta.fileName} (${response.status})`)

        // Create a placeholder document with basic content
        store.commit(
          events.documentCreated({
            id: docMeta.id,
            title: docMeta.title,
            content: `# ${docMeta.title}\n\nThis document provides guidance for ${docMeta.title.toLowerCase()}. Content will be loaded when available.`,
            createdAt: docMeta.createdAt,
          })
        )
      }
    } catch (error) {
      console.error(`❌ Error loading seed document ${docMeta.fileName}:`, error)

      // Create a placeholder document as fallback
      store.commit(
        events.documentCreated({
          id: docMeta.id,
          title: docMeta.title,
          content: `# ${docMeta.title}\n\nThis document provides guidance for ${docMeta.title.toLowerCase()}. Content will be loaded when available.`,
          createdAt: docMeta.createdAt,
        })
      )
    }
  }

  console.log(`🌱 Document seeding completed: ${seedDocuments.length} documents seeded`)
}
