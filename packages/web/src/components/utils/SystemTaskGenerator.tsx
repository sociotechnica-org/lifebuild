import React, { useEffect, useRef } from 'react'
import { useQuery, useStore } from '../../livestore-compat.js'
import { getPlantedSystems$, getAllSystemTaskTemplates$ } from '@lifebuild/shared/queries'
import { events } from '@lifebuild/shared/schema'
import type { SystemTaskTemplate, SystemCadence } from '@lifebuild/shared/schema'
import { computeNextGenerateAt } from '@lifebuild/shared'

// ============================================================================
// Pure function: compute which tasks need to be generated
// ============================================================================

export interface TaskToGenerate {
  taskId: string
  templateId: string
  systemId: string
  title: string
  description: string | null
  /** The scheduled time for this task (the template's nextGenerateAt at generation time) */
  scheduledAt: Date
  /** The next nextGenerateAt value after this task is generated */
  nextGenerateAt: Date
}

export interface TemplateInput {
  id: string
  systemId: string
  title: string
  description: string | null
  cadence: SystemCadence
  nextGenerateAt: Date | null
}

/**
 * Computes all tasks that need to be generated for a set of templates.
 *
 * For each template whose nextGenerateAt is in the past, generates tasks
 * iteratively advancing the schedule until nextGenerateAt is in the future
 * or the per-template cap is reached.
 *
 * This is a pure function with no side effects - it returns a list of tasks
 * to generate along with the final nextGenerateAt for each template.
 *
 * @param templates - Task templates from planted systems
 * @param now - Current time (for testability)
 * @param maxPerTemplate - Maximum tasks to generate per template per session (default 52)
 * @param idGenerator - Function to generate unique IDs (default crypto.randomUUID)
 */
export function computeTasksToGenerate(
  templates: readonly TemplateInput[],
  now: Date,
  maxPerTemplate: number = 52,
  idGenerator: () => string = () => crypto.randomUUID()
): TaskToGenerate[] {
  const tasks: TaskToGenerate[] = []
  const nowMs = now.getTime()

  for (const template of templates) {
    if (template.nextGenerateAt === null) {
      continue
    }

    let currentNextGenerateAt = template.nextGenerateAt
    let iterations = 0

    while (currentNextGenerateAt.getTime() <= nowMs && iterations < maxPerTemplate) {
      const taskId = idGenerator()
      const nextGenerate = computeNextGenerateAt(template.cadence, currentNextGenerateAt)

      tasks.push({
        taskId,
        templateId: template.id,
        systemId: template.systemId,
        title: template.title,
        description: template.description,
        scheduledAt: currentNextGenerateAt,
        nextGenerateAt: nextGenerate,
      })

      currentNextGenerateAt = nextGenerate
      iterations++
    }
  }

  return tasks
}

// ============================================================================
// React component: mounts in app shell, runs once per session
// ============================================================================

// Global flag to prevent multiple generation attempts across component instances
let globalGenerationAttempted = false

export const SystemTaskGenerator: React.FC = () => {
  const { store } = useStore()
  const plantedSystems = useQuery(getPlantedSystems$)
  const allTemplates = useQuery(getAllSystemTaskTemplates$)
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (globalGenerationAttempted || hasRunRef.current) {
      return
    }

    // Wait until queries have loaded
    if (plantedSystems === undefined || allTemplates === undefined) {
      return
    }

    // No planted systems means no work to do
    if (plantedSystems.length === 0) {
      return
    }

    // Build a set of planted system IDs for quick lookup
    const plantedSystemIds = new Set(plantedSystems.map(s => s.id))

    // Filter templates to only those belonging to planted systems
    const activeTemplates: TemplateInput[] = allTemplates
      .filter(t => plantedSystemIds.has(t.systemId))
      .map(
        (t: SystemTaskTemplate): TemplateInput => ({
          id: t.id,
          systemId: t.systemId,
          title: t.title,
          description: t.description ?? null,
          cadence: t.cadence as SystemCadence,
          nextGenerateAt: t.nextGenerateAt ?? null,
        })
      )

    if (activeTemplates.length === 0) {
      return
    }

    const tasksToGenerate = computeTasksToGenerate(activeTemplates, new Date())

    if (tasksToGenerate.length === 0) {
      return
    }

    // Mark as attempted before committing to prevent race conditions
    globalGenerationAttempted = true
    hasRunRef.current = true

    const generate = async () => {
      try {
        console.log(
          `[SystemTaskGenerator] Generating ${tasksToGenerate.length} tasks from ${activeTemplates.length} templates`
        )

        for (const task of tasksToGenerate) {
          // Create the task
          store.commit(
            events.taskCreatedV2({
              id: task.taskId,
              title: task.title,
              description: task.description ?? undefined,
              assigneeIds: undefined,
              status: 'todo',
              position: 0,
              createdAt: new Date(task.scheduledAt),
              actorId: 'system',
            })
          )

          // Record generation and advance the schedule
          store.commit(
            events.systemTaskGenerated({
              systemId: task.systemId,
              templateId: task.templateId,
              taskId: task.taskId,
              generatedAt: new Date(task.scheduledAt),
              nextGenerateAt: new Date(task.nextGenerateAt),
              actorId: 'system',
            })
          )
        }

        console.log(`[SystemTaskGenerator] Successfully generated ${tasksToGenerate.length} tasks`)
      } catch (error) {
        console.error('[SystemTaskGenerator] Failed to generate tasks:', error)
        // Reset flags so we can retry on next render if needed
        globalGenerationAttempted = false
        hasRunRef.current = false
      }
    }

    void generate()
  }, [plantedSystems, allTemplates, store])

  // This is a background utility component - renders nothing
  return null
}

// Export function to reset global state (for testing)
export const resetSystemTaskGeneratorState = () => {
  globalGenerationAttempted = false
}
