import React from 'react'
import { DndContext, DragOverlay, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import type { Task } from '@lifebuild/shared/schema'
import type { StatusColumn } from '@lifebuild/shared'
import { KanbanColumn } from './KanbanColumn/KanbanColumn.js'
import { TaskCard } from '../TaskCard/TaskCard.js'
import { RecurringTasksColumn } from '../../recurring-tasks/RecurringTasksColumn.js'

interface KanbanBoardProps {
  statusColumns: readonly StatusColumn[]
  tasksByStatus: Record<string, Task[]>
  onTaskClick?: (taskId: string) => void
  enableDragAndDrop?: boolean
  onDragStart?: (event: DragStartEvent) => void
  onDragOver?: (event: DragOverEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  insertionPreview?: { statusId: string; position: number } | null
  activeTask?: Task | null
  dragOverAddCard?: string | null
  showRecurringTasks?: boolean
  projectId?: string | null
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  statusColumns,
  tasksByStatus,
  onTaskClick,
  enableDragAndDrop = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  insertionPreview,
  activeTask,
  dragOverAddCard,
  showRecurringTasks = false,
  projectId,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const kanbanContent = (
    <div className='flex h-full overflow-x-auto p-6 gap-6 pb-6'>
      {showRecurringTasks && <RecurringTasksColumn projectId={projectId} />}
      {statusColumns.map(statusColumn => (
        <KanbanColumn
          key={statusColumn.id}
          column={statusColumn}
          tasks={tasksByStatus[statusColumn.status] || []}
          insertionPreview={
            insertionPreview?.statusId === statusColumn.id ? insertionPreview.position : null
          }
          draggedTaskHeight={activeTask ? 76 : 0} // Approximate task card height
          draggedTaskId={activeTask?.id || null}
          showAddCardPreview={dragOverAddCard === statusColumn.id}
          onTaskClick={onTaskClick}
          projectId={projectId}
        />
      ))}
    </div>
  )

  if (!enableDragAndDrop) {
    return kanbanContent
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {kanbanContent}
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}</DragOverlay>
    </DndContext>
  )
}
