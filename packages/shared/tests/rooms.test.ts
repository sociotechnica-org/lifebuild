import { describe, expect, it } from 'vitest'
import {
  LIFE_MAP_ROOM,
  COUNCIL_CHAMBER,
  SORTING_ROOM,
  createProjectRoomDefinition,
} from '../src/rooms.js'

describe('rooms definitions', () => {
  it('provides a deterministic life map room', () => {
    expect(LIFE_MAP_ROOM.roomId).toBe('life-map')
    expect(LIFE_MAP_ROOM.worker.id).toBe('life-map-mesa')
    expect(LIFE_MAP_ROOM.scope).toBe('workspace')
  })

  it('provides a council chamber room for Jarvis', () => {
    expect(COUNCIL_CHAMBER.roomId).toBe('council-chamber')
    expect(COUNCIL_CHAMBER.worker.name).toBe('Jarvis')
    expect(COUNCIL_CHAMBER.roomKind).toBe('council-chamber')
  })

  it('provides a sorting room for Marvin', () => {
    expect(SORTING_ROOM.roomId).toBe('sorting-room')
    expect(SORTING_ROOM.worker.name).toBe('Marvin')
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
