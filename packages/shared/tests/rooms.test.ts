import { describe, expect, it } from 'vitest'
import {
  CATEGORY_ROOMS,
  LIFE_MAP_ROOM,
  createProjectRoomDefinition,
  getCategoryRoomDefinition,
} from '../src/rooms.js'

describe('rooms definitions', () => {
  it('provides a deterministic life map room', () => {
    expect(LIFE_MAP_ROOM.roomId).toBe('life-map')
    expect(LIFE_MAP_ROOM.worker.id).toBe('life-map-mesa')
    expect(LIFE_MAP_ROOM.worker.status).toBe('inactive')
    expect(LIFE_MAP_ROOM.scope).toBe('workspace')
  })

  it('exposes category rooms keyed by slug', () => {
    expect(Object.keys(CATEGORY_ROOMS)).toContain('health')
    const healthRoom = getCategoryRoomDefinition('health')
    expect(healthRoom.roomId).toBe('category:health')
    expect(healthRoom.worker.name).toBe('Maya')
  })

  it('creates unique project room definitions', () => {
    const def = createProjectRoomDefinition({
      projectId: 'abc123',
      name: 'My Project',
      description: 'Test description',
      objectives: 'Do great work',
      attributes: {
        deadline: Date.parse('2024-02-01T00:00:00Z'),
        priority: 2,
        planningStage: 3,
        estimatedDuration: 12,
        urgency: 'high',
      },
    })
    expect(def.roomId).toBe('project:abc123')
    expect(def.worker.id).toBe('project-abc123-guide')
    expect(def.worker.prompt).toContain('My Project')
    expect(def.worker.prompt).toContain('Test description')
    expect(def.worker.prompt).toContain('Do great work')
    expect(def.worker.prompt).toContain('2024-02-01T00:00:00.000Z')
    expect(def.worker.prompt).toContain('Priority: 2')
    expect(def.worker.prompt).toContain('Planning Stage: 3')
    expect(def.worker.prompt).toContain('Estimated Duration: 12h')
    expect(def.worker.prompt).toContain('Urgency: high')
  })
})
