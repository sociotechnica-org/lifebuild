import React, { useMemo } from 'react'
import type { Project, Task, TableBronzeStackEntry } from '@work-squared/shared/schema'

export interface BronzePanelProps {
  tabledStack: readonly TableBronzeStackEntry[]
  availableTasks: readonly Task[]
  allTasks: readonly Task[]
  allProjects: readonly Project[]
}

/**
 * Bronze Panel - Shows tabled tasks and available pool
 */
export const BronzePanel: React.FC<BronzePanelProps> = ({
  tabledStack,
  availableTasks,
  allTasks,
  allProjects,
}) => {
  // Get task details for tabled items
  const tabledTasksWithDetails = useMemo(() => {
    return tabledStack.map(entry => {
      const task = allTasks.find(t => t.id === entry.taskId)
      const project = task?.projectId ? allProjects.find(p => p.id === task.projectId) : null
      return { entry, task, project }
    })
  }, [tabledStack, allTasks, allProjects])

  // Get project details for available tasks
  const availableTasksWithDetails = useMemo(() => {
    return availableTasks.map(task => {
      const project = task.projectId ? allProjects.find(p => p.id === task.projectId) : null
      return { task, project }
    })
  }, [availableTasks, allProjects])

  return (
    <div className='sorting-room-stream-panel'>
      {/* Tabled Section */}
      <div className='sorting-room-section'>
        <h3 className='sorting-room-section-title'>TABLED ({tabledStack.length})</h3>
        {tabledStack.length === 0 ? (
          <div className='sorting-room-empty-slot'>
            <span>No bronze tasks on table</span>
            <span className='sorting-room-empty-hint'>Add tasks from the available pool below</span>
          </div>
        ) : (
          <div className='sorting-room-queue-list'>
            {tabledTasksWithDetails.map(({ entry, task, project }, index) => (
              <div key={entry.id} className='sorting-room-task-card tabled bronze'>
                <span className='sorting-room-queue-position'>#{index + 1}</span>
                <div className='sorting-room-task-info'>
                  <div className='sorting-room-task-title'>{task?.title ?? 'Unknown task'}</div>
                  <div className='sorting-room-task-meta'>
                    {project?.name && <span>{project.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Validation warning */}
        {tabledStack.length < 3 && tabledStack.length > 0 && (
          <div className='sorting-room-warning'>
            ⚠️ Minimum 3 bronze tasks recommended. Add {3 - tabledStack.length} more.
          </div>
        )}
      </div>

      {/* Available Section */}
      <div className='sorting-room-section'>
        <h3 className='sorting-room-section-title'>AVAILABLE ({availableTasks.length})</h3>
        {availableTasks.length === 0 ? (
          <div className='sorting-room-empty-queue'>
            No available tasks. Tasks from active projects will appear here.
          </div>
        ) : (
          <div className='sorting-room-queue-list'>
            {availableTasksWithDetails.map(({ task, project }) => (
              <div key={task.id} className='sorting-room-task-card available bronze'>
                <div className='sorting-room-task-info'>
                  <div className='sorting-room-task-title'>{task.title}</div>
                  <div className='sorting-room-task-meta'>
                    {project?.name && <span>{project.name}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
