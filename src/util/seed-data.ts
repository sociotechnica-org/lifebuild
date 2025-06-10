import type { LiveStore } from '@livestore/livestore'
import { events } from '../livestore/schema.js'

export function seedSampleBoards(store: LiveStore) {
  const now = new Date()

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

  // Commit board creation events
  sampleBoards.forEach(board => {
    store.commit(events.boardCreated(board))
  })
}
