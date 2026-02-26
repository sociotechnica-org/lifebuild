import { events, type HexPosition } from '@lifebuild/shared/schema'
import type { Store } from '@livestore/livestore'
import { isReservedProjectHex } from './placementRules.js'

export class HexPlacementConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HexPlacementConflictError'
  }
}

type PlaceProjectOnHexInput = {
  projectId: string
  hexQ: number
  hexR: number
  actorId?: string
  placementId?: string
  placedAt?: Date
}

type RemoveProjectFromHexInput = {
  projectId: string
  actorId?: string
  removedAt?: Date
}

const isTargetHexOccupied = (
  positions: readonly HexPosition[],
  hexQ: number,
  hexR: number,
  excludeEntityType: string,
  excludeEntityId: string
) => {
  return positions.find(
    position =>
      position.hexQ === hexQ &&
      position.hexR === hexR &&
      !(position.entityType === excludeEntityType && position.entityId === excludeEntityId)
  )
}

export async function placeProjectOnHex(
  store: Store,
  positions: readonly HexPosition[],
  { projectId, hexQ, hexR, actorId, placementId, placedAt }: PlaceProjectOnHexInput
) {
  if (isReservedProjectHex(hexQ, hexR)) {
    throw new HexPlacementConflictError(`Hex (${hexQ}, ${hexR}) is reserved for landmarks`)
  }

  const conflictingPosition = isTargetHexOccupied(positions, hexQ, hexR, 'project', projectId)
  if (conflictingPosition) {
    throw new HexPlacementConflictError(`Hex (${hexQ}, ${hexR}) is already occupied`)
  }

  const existingPosition = positions.find(
    position => position.entityType === 'project' && position.entityId === projectId
  )
  if (existingPosition && existingPosition.hexQ === hexQ && existingPosition.hexR === hexR) {
    return
  }
  if (existingPosition) {
    throw new HexPlacementConflictError(
      `Project ${projectId} already has a hex position and must be removed before re-placing`
    )
  }

  await store.commit(
    events.hexPositionPlaced({
      id: placementId ?? crypto.randomUUID(),
      hexQ,
      hexR,
      entityType: 'project',
      entityId: projectId,
      actorId,
      placedAt: placedAt ?? new Date(),
    })
  )
}

export async function removeProjectFromHex(
  store: Store,
  positions: readonly HexPosition[],
  { projectId, actorId, removedAt }: RemoveProjectFromHexInput
) {
  const position = positions.find(
    currentPosition =>
      currentPosition.entityType === 'project' && currentPosition.entityId === projectId
  )
  if (!position) {
    return
  }

  await store.commit(
    events.hexPositionRemoved({
      id: position.id,
      actorId,
      removedAt: removedAt ?? new Date(),
    })
  )
}

type PlaceSystemOnHexInput = {
  systemId: string
  hexQ: number
  hexR: number
  actorId?: string
  placementId?: string
  placedAt?: Date
}

type RemoveSystemFromHexInput = {
  systemId: string
  actorId?: string
  removedAt?: Date
}

export async function placeSystemOnHex(
  store: Store,
  positions: readonly HexPosition[],
  { systemId, hexQ, hexR, actorId, placementId, placedAt }: PlaceSystemOnHexInput
) {
  if (isReservedProjectHex(hexQ, hexR)) {
    throw new HexPlacementConflictError(`Hex (${hexQ}, ${hexR}) is reserved for landmarks`)
  }

  const conflictingPosition = isTargetHexOccupied(positions, hexQ, hexR, 'system', systemId)
  if (conflictingPosition) {
    throw new HexPlacementConflictError(`Hex (${hexQ}, ${hexR}) is already occupied`)
  }

  const existingPosition = positions.find(
    position => position.entityType === 'system' && position.entityId === systemId
  )
  if (existingPosition && existingPosition.hexQ === hexQ && existingPosition.hexR === hexR) {
    return
  }
  if (existingPosition) {
    throw new HexPlacementConflictError(
      `System ${systemId} already has a hex position and must be removed before re-placing`
    )
  }

  await store.commit(
    events.hexPositionPlaced({
      id: placementId ?? crypto.randomUUID(),
      hexQ,
      hexR,
      entityType: 'system',
      entityId: systemId,
      actorId,
      placedAt: placedAt ?? new Date(),
    })
  )
}

export async function removeSystemFromHex(
  store: Store,
  positions: readonly HexPosition[],
  { systemId, actorId, removedAt }: RemoveSystemFromHexInput
) {
  const position = positions.find(
    currentPosition =>
      currentPosition.entityType === 'system' && currentPosition.entityId === systemId
  )
  if (!position) {
    return
  }

  await store.commit(
    events.hexPositionRemoved({
      id: position.id,
      actorId,
      removedAt: removedAt ?? new Date(),
    })
  )
}
