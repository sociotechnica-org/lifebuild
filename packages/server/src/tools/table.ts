/**
 * Table Management Tools for the Sorting Room
 * These tools manage the "table" - the active work configuration
 * with Gold slot, Silver slot, and Bronze stack
 */

import type { LiveStore } from '../types/livestore.js'
import { events } from '@lifebuild/shared/schema'
import {
  getTableConfiguration$,
  getTableBronzeStack$,
  getProjectById$,
  getTaskById$,
} from '@lifebuild/shared/queries'
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

async function assignTableGoldCore(
  store: LiveStore,
  params: AssignTableGoldParams,
  actorId?: string
): Promise<AssignTableGoldResult> {
  const projects = (await store.query(getProjectById$(params.projectId))) as any[]
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

export const assignTableGold = (store: LiveStore, params: any, actorId?: string) =>
  wrapToolFunction((store: LiveStore, params: any) => assignTableGoldCore(store, params, actorId))(
    store,
    params
  )

function clearTableGoldCore(store: LiveStore, actorId?: string): ClearTableGoldResult {
  const now = new Date()
  store.commit(
    events.tableGoldCleared({
      updatedAt: now,
      actorId,
    })
  )

  return { success: true }
}

export const clearTableGold = (store: LiveStore, _params: any, actorId?: string) =>
  wrapNoParamFunction((store: LiveStore) => clearTableGoldCore(store, actorId))(store)

// ===== SILVER SLOT MANAGEMENT =====

async function assignTableSilverCore(
  store: LiveStore,
  params: AssignTableSilverParams,
  actorId?: string
): Promise<AssignTableSilverResult> {
  const projects = (await store.query(getProjectById$(params.projectId))) as any[]
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

export const assignTableSilver = (store: LiveStore, params: any, actorId?: string) =>
  wrapToolFunction((store: LiveStore, params: any) =>
    assignTableSilverCore(store, params, actorId)
  )(store, params)

function clearTableSilverCore(store: LiveStore, actorId?: string): ClearTableSilverResult {
  const now = new Date()
  store.commit(
    events.tableSilverCleared({
      updatedAt: now,
      actorId,
    })
  )

  return { success: true }
}

export const clearTableSilver = (store: LiveStore, _params: any, actorId?: string) =>
  wrapNoParamFunction((store: LiveStore) => clearTableSilverCore(store, actorId))(store)

// ===== BRONZE MODE MANAGEMENT =====

function updateBronzeModeCore(
  store: LiveStore,
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

export const updateBronzeMode = (store: LiveStore, params: any, actorId?: string) =>
  wrapToolFunction((store: LiveStore, params: any) => updateBronzeModeCore(store, params, actorId))(
    store,
    params
  )

// ===== BRONZE STACK MANAGEMENT =====

async function addBronzeTaskCore(
  store: LiveStore,
  params: AddBronzeTaskParams,
  actorId?: string
): Promise<AddBronzeTaskResult> {
  // Verify task exists
  const tasks = (await store.query(getTaskById$(params.taskId))) as any[]
  const task = tasks?.[0]

  if (!task) {
    return { success: false, error: `Task not found: ${params.taskId}` }
  }

  // Get current stack to determine position
  const stack = (await store.query(getTableBronzeStack$)) as any[]
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

export const addBronzeTask = (store: LiveStore, params: any, actorId?: string) =>
  wrapToolFunction((store: LiveStore, params: any) => addBronzeTaskCore(store, params, actorId))(
    store,
    params
  )

function removeBronzeTaskCore(
  store: LiveStore,
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

export const removeBronzeTask = (store: LiveStore, params: any, actorId?: string) =>
  wrapToolFunction((store: LiveStore, params: any) => removeBronzeTaskCore(store, params, actorId))(
    store,
    params
  )

function reorderBronzeStackCore(
  store: LiveStore,
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

export const reorderBronzeStack = (store: LiveStore, params: any, actorId?: string) =>
  wrapToolFunction((store: LiveStore, params: any) =>
    reorderBronzeStackCore(store, params, actorId)
  )(store, params)

// ===== TABLE CONFIGURATION QUERY =====

async function getTableConfigurationCore(store: LiveStore): Promise<GetTableConfigurationResult> {
  const config = await store.query(getTableConfiguration$)

  // Get project names if assigned
  let goldProjectName: string | undefined
  let silverProjectName: string | undefined

  if (config?.goldProjectId) {
    const projects = (await store.query(getProjectById$(config.goldProjectId))) as any[]
    goldProjectName = projects?.[0]?.name
  }

  if (config?.silverProjectId) {
    const projects = (await store.query(getProjectById$(config.silverProjectId))) as any[]
    silverProjectName = projects?.[0]?.name
  }

  // Get bronze stack count
  const stack = (await store.query(getTableBronzeStack$)) as any[]
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

export const getTableConfiguration = (store: LiveStore, _params?: any, _actorId?: string) =>
  wrapNoParamFunction((store: LiveStore) => getTableConfigurationCore(store))(store)
