import React from 'react'
import { DndContext, DragOverlay, DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core'
import { useSensors, useSensor, PointerSensor, KeyboardSensor } from '@dnd-kit/core'
import type { Column, Task } from '@work-squared/shared/schema'
import { KanbanColumn } from './KanbanColumn/KanbanColumn.js'
import { TaskCard } from '../TaskCard/TaskCard.js'
import { RecurringTasksColumn } from '../../recurring-tasks/RecurringTasksColumn.js'

interface KanbanBoardProps {
  columns: readonly Column[]
  tasksByColumn: Record<string, Task[]>
  onTaskClick?: (taskId: string) => void
  enableDragAndDrop?: boolean
  onDragStart?: (event: DragStartEvent) => void
  onDragOver?: (event: DragOverEvent) => void
  onDragEnd?: (event: DragEndEvent) => void
  insertionPreview?: { columnId: string; position: number } | null
  activeTask?: Task | null
  dragOverAddCard?: string | null
  showRecurringTasks?: boolean
  projectId?: string | null
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  tasksByColumn,
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
      {columns.map((column: Column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          tasks={tasksByColumn[column.id] || []}
          insertionPreview={
            insertionPreview?.columnId === column.id ? insertionPreview.position : null
          }
          draggedTaskHeight={activeTask ? 76 : 0} // Approximate task card height
          draggedTaskId={activeTask?.id || null}
          showAddCardPreview={dragOverAddCard === column.id}
          onTaskClick={onTaskClick}
        />
      ))}
      {showRecurringTasks && <RecurringTasksColumn projectId={projectId} />}
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
