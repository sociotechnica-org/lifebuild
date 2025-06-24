import { useQuery, useStore } from '@livestore/react'
import React, { useState, useEffect } from 'react'
import { getOrphanedTasks$, getOrphanedColumns$ } from '../livestore/queries.js'
import type { Task } from '../livestore/schema.js'
import { events } from '../livestore/schema.js'
import { OrphanedKanbanColumn } from './OrphanedKanbanColumn.js'
import { CreateTaskModal } from './CreateTaskModal.js'

export const OrphanedTasksPage: React.FC = () => {
  const { store } = useStore()
  const tasks = useQuery(getOrphanedTasks$) ?? []
  const columns = useQuery(getOrphanedColumns$) ?? []
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [hasInitializedColumns, setHasInitializedColumns] = useState(false)

  // Initialize default columns for orphaned tasks if none exist
  useEffect(() => {
    if (columns.length === 0 && !hasInitializedColumns) {
      setHasInitializedColumns(true)
      const defaultColumns = [
        { name: 'To Do', position: 0 },
        { name: 'In Progress', position: 1 },
        { name: 'Done', position: 2 },
      ]

      defaultColumns.forEach(column => {
        store.commit(
          events.columnCreated({
            id: `orphaned-${column.name.toLowerCase().replace(/\s+/g, '-')}`,
            projectId: undefined, // undefined for orphaned columns
            name: column.name,
            position: column.position,
            createdAt: new Date(),
          })
        )
      })
    }
  }, [columns.length, hasInitializedColumns, store])

  const tasksByColumn = React.useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    columns.forEach(column => {
      grouped[column.id] = tasks.filter(task => task.columnId === column.id)
    })
    return grouped
  }, [tasks, columns])

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto p-8'>
        <div className='flex justify-between items-center mb-8'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Orphaned Tasks</h1>
            <p className='text-gray-600 mt-2'>Tasks that don't belong to any specific project</p>
          </div>
          <button
            onClick={() => setIsCreateTaskModalOpen(true)}
            className='bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors'
          >
            Create Task
          </button>
        </div>

        {columns.length === 0 ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto'></div>
              <p className='text-gray-500 mt-4'>Setting up columns...</p>
            </div>
          </div>
        ) : (
          <div className='flex gap-6 overflow-x-auto pb-6'>
            {columns.map(column => (
              <OrphanedKanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] || []}
              />
            ))}
          </div>
        )}

        <CreateTaskModal
          isOpen={isCreateTaskModalOpen}
          onClose={() => setIsCreateTaskModalOpen(false)}
          projectId={null} // null for orphaned tasks
          defaultColumnId={columns[0]?.id}
        />
      </div>
    </div>
  )
}
