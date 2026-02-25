import { describe, it, expect } from 'vitest'
import {
  computeTasksToGenerate,
  type TemplateInput,
} from '../../src/components/utils/SystemTaskGenerator'

// Deterministic ID generator for tests
function makeIdGenerator(): () => string {
  let counter = 0
  return () => `test-id-${++counter}`
}

describe('computeTasksToGenerate', () => {
  it('generates tasks for a template whose nextGenerateAt is in the past (weekly, 2 weeks behind)', () => {
    const now = new Date('2026-02-24T12:00:00Z')
    const twoWeeksAgo = new Date('2026-02-10T12:00:00Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Weekly Review',
        description: 'Review the week',
        cadence: 'weekly',
        nextGenerateAt: twoWeeksAgo,
      },
    ]

    const result = computeTasksToGenerate(templates, now, 52, makeIdGenerator())

    // Feb 10 <= now -> task 1, next = Feb 17
    // Feb 17 <= now -> task 2, next = Feb 24
    // Feb 24 <= now (equal) -> task 3, next = Mar 3
    // Mar 3 > now -> stop
    expect(result).toHaveLength(3)

    const first = result[0]!
    expect(first.taskId).toBe('test-id-1')
    expect(first.templateId).toBe('tmpl-1')
    expect(first.systemId).toBe('sys-1')
    expect(first.title).toBe('Weekly Review')
    expect(first.description).toBe('Review the week')
    expect(first.scheduledAt.toISOString()).toBe('2026-02-10T12:00:00.000Z')
    expect(first.nextGenerateAt.toISOString()).toBe('2026-02-17T12:00:00.000Z')

    const second = result[1]!
    expect(second.taskId).toBe('test-id-2')
    expect(second.scheduledAt.toISOString()).toBe('2026-02-17T12:00:00.000Z')
    expect(second.nextGenerateAt.toISOString()).toBe('2026-02-24T12:00:00.000Z')

    const third = result[2]!
    expect(third.taskId).toBe('test-id-3')
    expect(third.scheduledAt.toISOString()).toBe('2026-02-24T12:00:00.000Z')
    expect(third.nextGenerateAt.toISOString()).toBe('2026-03-03T12:00:00.000Z')
  })

  it('generates nothing for a template whose nextGenerateAt is in the future', () => {
    const now = new Date('2026-02-24T12:00:00Z')
    const nextWeek = new Date('2026-03-03T12:00:00Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Weekly Review',
        description: null,
        cadence: 'weekly',
        nextGenerateAt: nextWeek,
      },
    ]

    const result = computeTasksToGenerate(templates, now, 52, makeIdGenerator())
    expect(result).toHaveLength(0)
  })

  it('generates nothing for a template with null nextGenerateAt', () => {
    const now = new Date('2026-02-24T12:00:00Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Weekly Review',
        description: null,
        cadence: 'weekly',
        nextGenerateAt: null,
      },
    ]

    const result = computeTasksToGenerate(templates, now, 52, makeIdGenerator())
    expect(result).toHaveLength(0)
  })

  it('respects the 52-task cap per template', () => {
    const now = new Date('2026-02-24T12:00:00Z')
    // Set nextGenerateAt to more than 52 days in the past (daily cadence)
    const longAgo = new Date('2025-12-01T12:00:00Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Daily Check-in',
        description: null,
        cadence: 'daily',
        nextGenerateAt: longAgo,
      },
    ]

    const result = computeTasksToGenerate(templates, now, 52, makeIdGenerator())
    expect(result).toHaveLength(52)
  })

  it('respects a custom cap per template', () => {
    const now = new Date('2026-02-24T12:00:00Z')
    const tenDaysAgo = new Date('2026-02-14T12:00:00Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Daily Check-in',
        description: null,
        cadence: 'daily',
        nextGenerateAt: tenDaysAgo,
      },
    ]

    const result = computeTasksToGenerate(templates, now, 5, makeIdGenerator())
    expect(result).toHaveLength(5)
  })

  it('handles multiple templates from different systems', () => {
    const now = new Date('2026-02-24T12:00:00Z')
    // Use a time that's strictly between two schedule points to get predictable counts
    const oneWeekAgo = new Date('2026-02-17T10:00:00Z')
    const oneDayAgo = new Date('2026-02-23T10:00:00Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Weekly Review',
        description: 'System 1 weekly review',
        cadence: 'weekly',
        nextGenerateAt: oneWeekAgo,
      },
      {
        id: 'tmpl-2',
        systemId: 'sys-2',
        title: 'Daily Stretch',
        description: null,
        cadence: 'daily',
        nextGenerateAt: oneDayAgo,
      },
    ]

    const result = computeTasksToGenerate(templates, now, 52, makeIdGenerator())

    // Template 1: Feb 17 10:00 <= now -> task, next = Feb 24 10:00 <= now -> task, next = Mar 3 10:00 > now
    // Template 2: Feb 23 10:00 <= now -> task, next = Feb 24 10:00 <= now -> task, next = Feb 25 10:00 > now
    expect(result).toHaveLength(4)
    // First two from template 1
    expect(result[0]!.templateId).toBe('tmpl-1')
    expect(result[1]!.templateId).toBe('tmpl-1')
    // Last two from template 2
    expect(result[2]!.templateId).toBe('tmpl-2')
    expect(result[3]!.templateId).toBe('tmpl-2')
  })

  it('generates a task when nextGenerateAt equals now exactly', () => {
    const now = new Date('2026-02-24T12:00:00Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Weekly Review',
        description: null,
        cadence: 'weekly',
        nextGenerateAt: new Date('2026-02-24T12:00:00Z'),
      },
    ]

    const result = computeTasksToGenerate(templates, now, 52, makeIdGenerator())

    // nextGenerateAt <= now (equal), so one task should be generated
    expect(result).toHaveLength(1)
    const task = result[0]!
    expect(task.scheduledAt.toISOString()).toBe('2026-02-24T12:00:00.000Z')
    // Next generate should be one week later
    expect(task.nextGenerateAt.toISOString()).toBe('2026-03-03T12:00:00.000Z')
  })

  it('handles monthly cadence correctly', () => {
    const now = new Date('2026-04-15T12:00:00Z')
    const twoMonthsAgo = new Date('2026-02-15T12:00:00Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Monthly Budget Review',
        description: null,
        cadence: 'monthly',
        nextGenerateAt: twoMonthsAgo,
      },
    ]

    const result = computeTasksToGenerate(templates, now, 52, makeIdGenerator())

    // Feb 15 <= now -> task, next = Mar 15
    // Mar 15 <= now -> task, next = Apr 15
    // Apr 15 <= now (equal) -> task, next = May 15
    expect(result).toHaveLength(3)
    const first = result[0]!
    const second = result[1]!
    const third = result[2]!
    expect(first.scheduledAt.toISOString()).toBe('2026-02-15T12:00:00.000Z')
    expect(first.nextGenerateAt.toISOString()).toBe('2026-03-15T12:00:00.000Z')
    expect(second.scheduledAt.toISOString()).toBe('2026-03-15T12:00:00.000Z')
    expect(second.nextGenerateAt.toISOString()).toBe('2026-04-15T12:00:00.000Z')
    expect(third.scheduledAt.toISOString()).toBe('2026-04-15T12:00:00.000Z')
    expect(third.nextGenerateAt.toISOString()).toBe('2026-05-15T12:00:00.000Z')
  })

  it('returns empty array for empty templates list', () => {
    const now = new Date('2026-02-24T12:00:00Z')
    const result = computeTasksToGenerate([], now)
    expect(result).toHaveLength(0)
  })

  it('generates nothing when nextGenerateAt is strictly after now', () => {
    const now = new Date('2026-02-24T11:59:59Z')

    const templates: TemplateInput[] = [
      {
        id: 'tmpl-1',
        systemId: 'sys-1',
        title: 'Weekly Review',
        description: null,
        cadence: 'weekly',
        nextGenerateAt: new Date('2026-02-24T12:00:00Z'),
      },
    ]

    const result = computeTasksToGenerate(templates, now, 52, makeIdGenerator())
    expect(result).toHaveLength(0)
  })
})
