import React, { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useStore } from '@livestore/react'
import type { Column, Task } from '../livestore/schema.js'
import { TaskCard } from './TaskCard.js'
import { AddTaskForm } from './AddTaskForm.js'
import { events } from '../livestore/schema.js'

interface KanbanColumnProps {
  column: Column
  tasks: Task[]
}

export function KanbanColumn({ column, tasks }: KanbanColumnProps) {
  const { store } = useStore()
  const [isAddingTask, setIsAddingTask] = useState(false)

  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
  })

  const handleAddTask = (title: string) => {
    const nextPosition = tasks.length === 0 ? 0 : Math.max(...tasks.map(t => t.position)) + 1

    store.commit(
      events.taskCreated({
        id: crypto.randomUUID(),
        boardId: column.boardId,
        columnId: column.id,
        title,
        position: nextPosition,
        createdAt: new Date(),
      })
    )

    setIsAddingTask(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-80 rounded-lg p-4 transition-colors ${
        isOver ? 'bg-blue-50 border-2 border-blue-300' : 'bg-gray-50'
      }`}
    >
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-sm font-semibold text-gray-900 uppercase tracking-wide'>
          {column.name}
        </h2>
        <span className='text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-1'>
          {tasks.length}
        </span>
      </div>
      <div className='space-y-2 min-h-24'>
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}

        {isAddingTask ? (
          <AddTaskForm onSubmit={handleAddTask} onCancel={() => setIsAddingTask(false)} />
        ) : (
          <button
            onClick={() => setIsAddingTask(true)}
            className='w-full p-3 text-left text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors text-sm'
          >
            ➕ Add Card
          </button>
        )}
      </div>
    </div>
  )
}
