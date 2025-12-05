/**
 * Table Management Tools for the Sorting Room
 * These tools manage the "table" - the active work configuration
 * with Gold slot, Silver slot, and Bronze stack
 */

import type { Store } from '@livestore/livestore'
import { events } from '@work-squared/shared/schema'
import {
  getProjects$,
  getTableConfiguration$,
  getTableBronzeStack$,
  getProjectById$,
  getTaskById$,
} from '@work-squared/shared/queries'
import type {
  AssignTableGoldParams,
  AssignTableGoldResult,
  ClearTableGoldResult,
  AssignTableSilverParams,
  AssignTableSilverResult,
  ClearTableSilverResult,
  UpdateBronzeModeParams,
  UpdateBronzeModeResult,
  AddBronzeTaskParams,
  AddBronzeTaskResult,
  RemoveBronzeTaskParams,
  RemoveBronzeTaskResult,
  ReorderBronzeStackParams,
  ReorderBronzeStackResult,
  GetTableConfigurationResult,
} from './types.js'
import { wrapToolFunction, wrapNoParamFunction } from './base.js'

const generateId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

// ===== GOLD SLOT MANAGEMENT =====

function assignTableGoldCore(
  store: Store,
  params: AssignTableGoldParams,
  actorId?: string
): AssignTableGoldResult {
  const projects = store.query(getProjectById$(params.projectId)) as any[]
  const project = projects?.[0]

  if (!project) {
    return { success: false, error: `Project not found: ${params.projectId}` }
  }

  const now = new Date()
  store.commit(
    events.tableGoldAssigned({
      projectId: params.projectId,
      updatedAt: now,
      actorId,
    })
  )

  return {
    success: true,
    projectId: params.projectId,
    projectName: project.name,
  }
}

export const assignTableGold = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => assignTableGoldCore(store, params, actorId))(
    store,
    params
  )

function clearTableGoldCore(store: Store, actorId?: string): ClearTableGoldResult {
  const now = new Date()
  store.commit(
    events.tableGoldCleared({
      updatedAt: now,
      actorId,
    })
  )

  return { success: true }
}

export const clearTableGold = (store: Store, _params: any, actorId?: string) =>
  wrapNoParamFunction((store: Store) => clearTableGoldCore(store, actorId))(store)

// ===== SILVER SLOT MANAGEMENT =====

function assignTableSilverCore(
  store: Store,
  params: AssignTableSilverParams,
  actorId?: string
): AssignTableSilverResult {
  const projects = store.query(getProjectById$(params.projectId)) as any[]
  const project = projects?.[0]

  if (!project) {
    return { success: false, error: `Project not found: ${params.projectId}` }
  }

  const now = new Date()
  store.commit(
    events.tableSilverAssigned({
      projectId: params.projectId,
      updatedAt: now,
      actorId,
    })
  )

  return {
    success: true,
    projectId: params.projectId,
    projectName: project.name,
  }
}

export const assignTableSilver = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => assignTableSilverCore(store, params, actorId))(
    store,
    params
  )

function clearTableSilverCore(store: Store, actorId?: string): ClearTableSilverResult {
  const now = new Date()
  store.commit(
    events.tableSilverCleared({
      updatedAt: now,
      actorId,
    })
  )

  return { success: true }
}

export const clearTableSilver = (store: Store, _params: any, actorId?: string) =>
  wrapNoParamFunction((store: Store) => clearTableSilverCore(store, actorId))(store)

// ===== BRONZE MODE MANAGEMENT =====

function updateBronzeModeCore(
  store: Store,
  params: UpdateBronzeModeParams,
  actorId?: string
): UpdateBronzeModeResult {
  const now = new Date()
  store.commit(
    events.tableBronzeModeUpdated({
      bronzeMode: params.bronzeMode,
      bronzeTargetExtra: params.bronzeTargetExtra,
      updatedAt: now,
      actorId,
    })
  )

  return {
    success: true,
    bronzeMode: params.bronzeMode,
    bronzeTargetExtra: params.bronzeTargetExtra,
  }
}

export const updateBronzeMode = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => updateBronzeModeCore(store, params, actorId))(
    store,
    params
  )

// ===== BRONZE STACK MANAGEMENT =====

function addBronzeTaskCore(
  store: Store,
  params: AddBronzeTaskParams,
  actorId?: string
): AddBronzeTaskResult {
  // Verify task exists
  const tasks = store.query(getTaskById$(params.taskId)) as any[]
  const task = tasks?.[0]

  if (!task) {
    return { success: false, error: `Task not found: ${params.taskId}` }
  }

  // Get current stack to determine position
  const stack = store.query(getTableBronzeStack$) as any[]
  const activeStack = stack.filter((e: any) => e.status === 'active')
  const maxPosition = activeStack.reduce((max: number, e: any) => Math.max(max, e.position), -1)

  const now = new Date()
  const entryId = generateId()

  store.commit(
    events.bronzeTaskAdded({
      id: entryId,
      taskId: params.taskId,
      position: maxPosition + 1,
      insertedAt: now,
      insertedBy: actorId,
      actorId,
    })
  )

  return {
    success: true,
    taskId: params.taskId,
    taskTitle: task.title,
    position: maxPosition + 1,
  }
}

export const addBronzeTask = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => addBronzeTaskCore(store, params, actorId))(
    store,
    params
  )

function removeBronzeTaskCore(
  store: Store,
  params: RemoveBronzeTaskParams,
  actorId?: string
): RemoveBronzeTaskResult {
  const now = new Date()
  store.commit(
    events.bronzeTaskRemoved({
      id: params.entryId,
      removedAt: now,
      actorId,
    })
  )

  return {
    success: true,
    entryId: params.entryId,
  }
}

export const removeBronzeTask = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => removeBronzeTaskCore(store, params, actorId))(
    store,
    params
  )

function reorderBronzeStackCore(
  store: Store,
  params: ReorderBronzeStackParams,
  actorId?: string
): ReorderBronzeStackResult {
  const now = new Date()
  store.commit(
    events.bronzeStackReordered({
      ordering: params.ordering,
      updatedAt: now,
      actorId,
    })
  )

  return {
    success: true,
    ordering: params.ordering,
  }
}

export const reorderBronzeStack = (store: Store, params: any, actorId?: string) =>
  wrapToolFunction((store: Store, params: any) => reorderBronzeStackCore(store, params, actorId))(
    store,
    params
  )

// ===== TABLE CONFIGURATION QUERY =====

function getTableConfigurationCore(store: Store): GetTableConfigurationResult {
  const config = store.query(getTableConfiguration$) as any

  // Get project names if assigned
  let goldProjectName: string | undefined
  let silverProjectName: string | undefined

  if (config?.goldProjectId) {
    const projects = store.query(getProjectById$(config.goldProjectId)) as any[]
    goldProjectName = projects?.[0]?.name
  }

  if (config?.silverProjectId) {
    const projects = store.query(getProjectById$(config.silverProjectId)) as any[]
    silverProjectName = projects?.[0]?.name
  }

  // Get bronze stack count
  const stack = store.query(getTableBronzeStack$) as any[]
  const activeStack = stack.filter((e: any) => e.status === 'active')

  return {
    success: true,
    configuration: {
      goldProjectId: config?.goldProjectId ?? null,
      goldProjectName,
      silverProjectId: config?.silverProjectId ?? null,
      silverProjectName,
      bronzeMode: config?.bronzeMode ?? 'minimal',
      bronzeTargetExtra: config?.bronzeTargetExtra ?? 0,
      bronzeStackCount: activeStack.length,
    },
  }
}

export const getTableConfiguration = (store: Store, _params?: any, _actorId?: string) =>
  wrapNoParamFunction((store: Store) => getTableConfigurationCore(store))(store)
