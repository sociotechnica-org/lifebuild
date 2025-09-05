import { describe, it, expect, beforeEach } from 'vitest'
import { createTestStore } from '../test-utils.js'
import { events } from '@work-squared/shared/schema'
import { DEFAULT_MODEL } from '@work-squared/shared'
import {
  getWorkerProjects$,
  getProjectWorkers$,
  getAllWorkerProjects$,
} from '@work-squared/shared/queries'

describe('Worker Project Assignment', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('should assign a worker to a project', async () => {
    const workerId = 'worker-1'
    const projectId = 'project-1'

    // Create a worker
    await store.commit(
      events.workerCreated({
        id: workerId,
        name: 'Test Worker',
        systemPrompt: 'Test system prompt',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    // Create a project
    await store.commit(
      events.projectCreated({
        id: projectId,
        name: 'Test Project',
        createdAt: new Date(),
      })
    )

    // Assign worker to project
    await store.commit(
      events.workerAssignedToProject({
        workerId,
        projectId,
      })
    )

    // Check that assignment was created
    const workerProjects = await store.query(getWorkerProjects$(workerId))
    expect(workerProjects).toHaveLength(1)
    expect(workerProjects[0].workerId).toBe(workerId)
    expect(workerProjects[0].projectId).toBe(projectId)

    const projectWorkers = await store.query(getProjectWorkers$(projectId))
    expect(projectWorkers).toHaveLength(1)
    expect(projectWorkers[0].workerId).toBe(workerId)
    expect(projectWorkers[0].projectId).toBe(projectId)
  })

  it('should unassign a worker from a project', async () => {
    const workerId = 'worker-1'
    const projectId = 'project-1'

    // Create a worker
    await store.commit(
      events.workerCreated({
        id: workerId,
        name: 'Test Worker',
        systemPrompt: 'Test system prompt',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    // Create a project
    await store.commit(
      events.projectCreated({
        id: projectId,
        name: 'Test Project',
        createdAt: new Date(),
      })
    )

    // Assign worker to project
    await store.commit(
      events.workerAssignedToProject({
        workerId,
        projectId,
      })
    )

    // Unassign worker from project
    await store.commit(
      events.workerUnassignedFromProject({
        workerId,
        projectId,
      })
    )

    // Check that assignment was removed
    const workerProjects = await store.query(getWorkerProjects$(workerId))
    expect(workerProjects).toHaveLength(0)

    const projectWorkers = await store.query(getProjectWorkers$(projectId))
    expect(projectWorkers).toHaveLength(0)
  })

  it('should handle multiple workers assigned to one project', async () => {
    const worker1Id = 'worker-1'
    const worker2Id = 'worker-2'
    const projectId = 'project-1'

    // Create workers
    await store.commit(
      events.workerCreated({
        id: worker1Id,
        name: 'Test Worker 1',
        systemPrompt: 'Test system prompt 1',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    await store.commit(
      events.workerCreated({
        id: worker2Id,
        name: 'Test Worker 2',
        systemPrompt: 'Test system prompt 2',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    // Create a project
    await store.commit(
      events.projectCreated({
        id: projectId,
        name: 'Test Project',
        createdAt: new Date(),
      })
    )

    // Assign both workers to project
    await store.commit(
      events.workerAssignedToProject({
        workerId: worker1Id,
        projectId,
      })
    )

    await store.commit(
      events.workerAssignedToProject({
        workerId: worker2Id,
        projectId,
      })
    )

    // Check that both workers are assigned
    const projectWorkers = await store.query(getProjectWorkers$(projectId))
    expect(projectWorkers).toHaveLength(2)
    expect(projectWorkers.map((pw: any) => pw.workerId)).toContain(worker1Id)
    expect(projectWorkers.map((pw: any) => pw.workerId)).toContain(worker2Id)
  })

  it('should handle one worker assigned to multiple projects', async () => {
    const workerId = 'worker-1'
    const project1Id = 'project-1'
    const project2Id = 'project-2'

    // Create a worker
    await store.commit(
      events.workerCreated({
        id: workerId,
        name: 'Test Worker',
        systemPrompt: 'Test system prompt',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    // Create projects
    await store.commit(
      events.projectCreated({
        id: project1Id,
        name: 'Test Project 1',
        createdAt: new Date(),
      })
    )

    await store.commit(
      events.projectCreated({
        id: project2Id,
        name: 'Test Project 2',
        createdAt: new Date(),
      })
    )

    // Assign worker to both projects
    await store.commit(
      events.workerAssignedToProject({
        workerId,
        projectId: project1Id,
      })
    )

    await store.commit(
      events.workerAssignedToProject({
        workerId,
        projectId: project2Id,
      })
    )

    // Check that worker is assigned to both projects
    const workerProjects = await store.query(getWorkerProjects$(workerId))
    expect(workerProjects).toHaveLength(2)
    expect(workerProjects.map((wp: any) => wp.projectId)).toContain(project1Id)
    expect(workerProjects.map((wp: any) => wp.projectId)).toContain(project2Id)
  })

  it('should return all worker-project assignments', async () => {
    const worker1Id = 'worker-1'
    const worker2Id = 'worker-2'
    const project1Id = 'project-1'
    const project2Id = 'project-2'

    // Create workers
    await store.commit(
      events.workerCreated({
        id: worker1Id,
        name: 'Test Worker 1',
        systemPrompt: 'Test system prompt 1',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    await store.commit(
      events.workerCreated({
        id: worker2Id,
        name: 'Test Worker 2',
        systemPrompt: 'Test system prompt 2',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    // Create projects
    await store.commit(
      events.projectCreated({
        id: project1Id,
        name: 'Test Project 1',
        createdAt: new Date(),
      })
    )

    await store.commit(
      events.projectCreated({
        id: project2Id,
        name: 'Test Project 2',
        createdAt: new Date(),
      })
    )

    // Create assignments
    await store.commit(
      events.workerAssignedToProject({
        workerId: worker1Id,
        projectId: project1Id,
      })
    )

    await store.commit(
      events.workerAssignedToProject({
        workerId: worker2Id,
        projectId: project2Id,
      })
    )

    await store.commit(
      events.workerAssignedToProject({
        workerId: worker1Id,
        projectId: project2Id,
      })
    )

    // Check all assignments
    const allAssignments = await store.query(getAllWorkerProjects$)
    expect(allAssignments).toHaveLength(3)

    // Check specific assignments exist
    expect(
      allAssignments.some((wp: any) => wp.workerId === worker1Id && wp.projectId === project1Id)
    ).toBe(true)
    expect(
      allAssignments.some((wp: any) => wp.workerId === worker2Id && wp.projectId === project2Id)
    ).toBe(true)
    expect(
      allAssignments.some((wp: any) => wp.workerId === worker1Id && wp.projectId === project2Id)
    ).toBe(true)
  })

  it('should create project with worker actor ID in history', async () => {
    const workerId = 'worker-1'
    const projectId = 'project-1'

    // Create a worker
    await store.commit(
      events.workerCreated({
        id: workerId,
        name: 'Test Worker',
        systemPrompt: 'Test system prompt',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    // Create a project with worker as actor
    await store.commit(
      events.projectCreated({
        id: projectId,
        name: 'Test Project',
        description: 'A project created by a worker',
        actorId: workerId, // Worker created this project
        createdAt: new Date(),
      })
    )

    // Check that project was created
    const projects = await store.query((db: any) => db.table('projects').all())
    expect(projects).toHaveLength(1)
    expect(projects[0].id).toBe(projectId)
    expect(projects[0].name).toBe('Test Project')

    // Check that history event was logged with the worker as actor
    const eventsLog = await store.query((db: any) => db.table('eventsLog').all())
    expect(eventsLog).toHaveLength(1)
    expect(eventsLog[0].eventType).toBe('v1.ProjectCreated')
    expect(eventsLog[0].actorId).toBe(workerId) // Worker should be recorded as actor

    // Parse the event data to verify the project details
    const eventData = JSON.parse(eventsLog[0].eventData)
    expect(eventData.id).toBe(projectId)
    expect(eventData.name).toBe('Test Project')
    expect(eventData.description).toBe('A project created by a worker')
  })

  it('should not create duplicate assignments', async () => {
    const workerId = 'worker-1'
    const projectId = 'project-1'

    // Create a worker
    await store.commit(
      events.workerCreated({
        id: workerId,
        name: 'Test Worker',
        systemPrompt: 'Test system prompt',
        defaultModel: DEFAULT_MODEL,
        createdAt: new Date(),
      })
    )

    // Create a project
    await store.commit(
      events.projectCreated({
        id: projectId,
        name: 'Test Project',
        createdAt: new Date(),
      })
    )

    // Assign worker to project twice
    await store.commit(
      events.workerAssignedToProject({
        workerId,
        projectId,
      })
    )

    await store.commit(
      events.workerAssignedToProject({
        workerId,
        projectId,
      })
    )

    // Should still only have one assignment
    const workerProjects = await store.query(getWorkerProjects$(workerId))
    expect(workerProjects).toHaveLength(1)
  })
})
