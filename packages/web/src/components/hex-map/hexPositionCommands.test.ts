import type { HexPosition } from '@lifebuild/shared/schema'
import type { Store } from '@livestore/livestore'
import { describe, expect, it, vi } from 'vitest'
import {
  HexPlacementConflictError,
  placeProjectOnHex,
  placeSystemOnHex,
  removeProjectFromHex,
  removeSystemFromHex,
} from './hexPositionCommands.js'

const createStoreMock = () => {
  const commit = vi.fn().mockResolvedValue(undefined)
  const store = { commit } as unknown as Store
  return { store, commit }
}

const basePositions: HexPosition[] = [
  {
    id: 'pos-1',
    hexQ: -2,
    hexR: 2,
    entityType: 'project',
    entityId: 'project-1',
    placedAt: new Date('2026-01-01T00:00:00Z'),
  },
]

describe('hexPositionCommands', () => {
  it('commits hexPosition.placed when the target hex is free', async () => {
    const { store, commit } = createStoreMock()
    const placedAt = new Date('2026-01-05T00:00:00Z')

    await placeProjectOnHex(store, basePositions, {
      projectId: 'project-2',
      hexQ: 2,
      hexR: -2,
      placementId: 'placement-1',
      placedAt,
      actorId: 'tester',
    })

    expect(commit).toHaveBeenCalledTimes(1)
    const committedEvent = commit.mock.calls[0]![0]
    expect(committedEvent.name).toBe('hexPosition.placed')
    expect(committedEvent.args).toMatchObject({
      id: 'placement-1',
      entityId: 'project-2',
      entityType: 'project',
      hexQ: 2,
      hexR: -2,
      placedAt,
      actorId: 'tester',
    })
  })

  it('throws when trying to place on an occupied hex', async () => {
    const { store, commit } = createStoreMock()

    await expect(
      placeProjectOnHex(store, basePositions, {
        projectId: 'project-2',
        hexQ: -2,
        hexR: 2,
      })
    ).rejects.toBeInstanceOf(HexPlacementConflictError)

    expect(commit).not.toHaveBeenCalled()
  })

  it('throws when trying to place on a reserved sanctuary hex', async () => {
    const { store, commit } = createStoreMock()

    await expect(
      placeProjectOnHex(store, basePositions, {
        projectId: 'project-2',
        hexQ: 1,
        hexR: -1,
      })
    ).rejects.toBeInstanceOf(HexPlacementConflictError)

    expect(commit).not.toHaveBeenCalled()
  })

  it('does not commit when the project is already on the target hex', async () => {
    const { store, commit } = createStoreMock()

    await placeProjectOnHex(store, basePositions, {
      projectId: 'project-1',
      hexQ: -2,
      hexR: 2,
    })

    expect(commit).not.toHaveBeenCalled()
  })

  it('throws when the project is already placed on a different hex', async () => {
    const { store, commit } = createStoreMock()

    await expect(
      placeProjectOnHex(store, basePositions, {
        projectId: 'project-1',
        hexQ: 2,
        hexR: -2,
      })
    ).rejects.toBeInstanceOf(HexPlacementConflictError)

    expect(commit).not.toHaveBeenCalled()
  })

  it('commits hexPosition.removed for a placed project', async () => {
    const { store, commit } = createStoreMock()
    const removedAt = new Date('2026-01-10T00:00:00Z')

    await removeProjectFromHex(store, basePositions, {
      projectId: 'project-1',
      actorId: 'tester',
      removedAt,
    })

    expect(commit).toHaveBeenCalledTimes(1)
    const committedEvent = commit.mock.calls[0]![0]
    expect(committedEvent.name).toBe('hexPosition.removed')
    expect(committedEvent.args).toMatchObject({
      id: 'pos-1',
      removedAt,
      actorId: 'tester',
    })
  })

  it('is a no-op when removing a project without a hex position', async () => {
    const { store, commit } = createStoreMock()

    await removeProjectFromHex(store, basePositions, {
      projectId: 'project-missing',
    })

    expect(commit).not.toHaveBeenCalled()
  })

  it('commits hexPosition.placed for a system with entityType system', async () => {
    const { store, commit } = createStoreMock()
    const placedAt = new Date('2026-02-01T00:00:00Z')

    await placeSystemOnHex(store, basePositions, {
      systemId: 'system-1',
      hexQ: 2,
      hexR: -2,
      placementId: 'sys-placement-1',
      placedAt,
      actorId: 'tester',
    })

    expect(commit).toHaveBeenCalledTimes(1)
    const committedEvent = commit.mock.calls[0]![0]
    expect(committedEvent.name).toBe('hexPosition.placed')
    expect(committedEvent.args).toMatchObject({
      id: 'sys-placement-1',
      entityId: 'system-1',
      entityType: 'system',
      hexQ: 2,
      hexR: -2,
      placedAt,
      actorId: 'tester',
    })
  })

  it('throws when placing a system on an occupied hex', async () => {
    const { store, commit } = createStoreMock()

    await expect(
      placeSystemOnHex(store, basePositions, {
        systemId: 'system-1',
        hexQ: -2,
        hexR: 2,
      })
    ).rejects.toBeInstanceOf(HexPlacementConflictError)

    expect(commit).not.toHaveBeenCalled()
  })

  it('throws when placing a system on a reserved hex', async () => {
    const { store, commit } = createStoreMock()

    await expect(
      placeSystemOnHex(store, basePositions, {
        systemId: 'system-1',
        hexQ: 0,
        hexR: 0,
      })
    ).rejects.toBeInstanceOf(HexPlacementConflictError)

    expect(commit).not.toHaveBeenCalled()
  })

  it('commits hexPosition.removed for a placed system', async () => {
    const { store, commit } = createStoreMock()
    const systemPositions: HexPosition[] = [
      {
        id: 'sys-pos-1',
        hexQ: 3,
        hexR: -3,
        entityType: 'system',
        entityId: 'system-1',
        placedAt: new Date('2026-02-01T00:00:00Z'),
      },
    ]
    const removedAt = new Date('2026-02-10T00:00:00Z')

    await removeSystemFromHex(store, systemPositions, {
      systemId: 'system-1',
      actorId: 'tester',
      removedAt,
    })

    expect(commit).toHaveBeenCalledTimes(1)
    const committedEvent = commit.mock.calls[0]![0]
    expect(committedEvent.name).toBe('hexPosition.removed')
    expect(committedEvent.args).toMatchObject({
      id: 'sys-pos-1',
      removedAt,
      actorId: 'tester',
    })
  })

  it('is a no-op when removing a system without a hex position', async () => {
    const { store, commit } = createStoreMock()

    await removeSystemFromHex(store, basePositions, {
      systemId: 'system-missing',
    })

    expect(commit).not.toHaveBeenCalled()
  })
})
