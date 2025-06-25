import type { Store } from '@livestore/livestore'
import { events } from '../livestore/schema.js'
import { aiLegalEthicsGuide } from './seeds/ai-legal-ethics-guide.js'
import { aiImplementationRoadmap } from './seeds/ai-implementation-roadmap.js'
import { aiVendorEvaluationChecklist } from './seeds/ai-vendor-evaluation-checklist.js'
import { aiContractReviewBestPractices } from './seeds/ai-contract-review-best-practices.js'
import { aiLegalResearchStrategies } from './seeds/ai-legal-research-strategies.js'

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

export function seedSessionDocuments(store: Store) {
  const now = new Date()

  // Define the seed documents with their content directly imported
  const seedDocuments = [
    {
      id: 'doc-ai-ethics-guide',
      title: 'AI Legal Ethics Guide',
      content: aiLegalEthicsGuide,
      createdAt: new Date(now.getTime() - 432000000), // 5 days ago
    },
    {
      id: 'doc-implementation-roadmap',
      title: 'AI Implementation Roadmap for Law Firms',
      content: aiImplementationRoadmap,
      createdAt: new Date(now.getTime() - 345600000), // 4 days ago
    },
    {
      id: 'doc-vendor-evaluation',
      title: 'AI Vendor Evaluation Checklist',
      content: aiVendorEvaluationChecklist,
      createdAt: new Date(now.getTime() - 259200000), // 3 days ago
    },
    {
      id: 'doc-contract-review',
      title: 'AI Contract Review Best Practices',
      content: aiContractReviewBestPractices,
      createdAt: new Date(now.getTime() - 172800000), // 2 days ago
    },
    {
      id: 'doc-legal-research',
      title: 'AI Legal Research Strategies',
      content: aiLegalResearchStrategies,
      createdAt: new Date(now.getTime() - 86400000), // 1 day ago
    },
  ]

  // Create documents using imported content
  seedDocuments.forEach(docMeta => {
    store.commit(
      events.documentCreated({
        id: docMeta.id,
        title: docMeta.title,
        content: docMeta.content,
        createdAt: docMeta.createdAt,
      })
    )

    console.log(`✅ Seeded document: ${docMeta.title}`)
  })

  console.log(`🌱 Document seeding completed: ${seedDocuments.length} documents seeded`)
}
