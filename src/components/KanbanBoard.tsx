import React from 'react'
import { useQuery } from '@livestore/react'
import { useParams } from 'react-router-dom'
import { getBoardColumns$, getBoardTasks$ } from '../livestore/queries.js'
import type { Column, Task } from '../livestore/schema.js'
import { KanbanColumn } from './KanbanColumn.js'

export function KanbanBoard() {
  const { boardId } = useParams<{ boardId: string }>()

  if (!boardId) {
    return <div>Board not found</div>
  }

  const columns = useQuery(getBoardColumns$(boardId)) ?? []
  const tasks = useQuery(getBoardTasks$(boardId)) ?? []

  // Group tasks by column
  const tasksByColumn = (tasks || []).reduce((acc: Record<string, Task[]>, task: Task) => {
    if (task?.columnId && !acc[task.columnId]) {
      acc[task.columnId] = []
    }
    if (task?.columnId) {
      acc[task.columnId]?.push(task)
    }
    return acc
  }, {})

  return (
    <div className='h-full bg-white'>
      <div className='flex h-full overflow-x-auto p-6 gap-6'>
        {(columns || []).map((column: Column) => (
          <KanbanColumn key={column.id} column={column} tasks={tasksByColumn[column.id] || []} />
        ))}
      </div>
    </div>
  )
}
