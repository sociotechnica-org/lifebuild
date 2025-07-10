import React, { useState, useEffect } from 'react'
import { useStore } from '@livestore/react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Worker, Project } from '../../../livestore/schema.js'
import { getWorkerProjects$, getProjects$ } from '../../../livestore/queries.js'
import { EditWorkerModal } from '../EditWorkerModal/EditWorkerModal.js'
import { getModelById, DEFAULT_MODEL } from '../../../util/models.js'
import { events } from '../../../livestore/schema.js'

interface WorkerCardProps {
  worker: Worker
  onClick?: () => void
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onClick }) => {
  const { store } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [assignedProjects, setAssignedProjects] = useState<Project[]>([])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Create a new conversation with this worker
    const conversationId = crypto.randomUUID()
    const title = `Chat with ${worker.name}`
    const model = worker.defaultModel || DEFAULT_MODEL

    store.commit(
      events.conversationCreated({
        id: conversationId,
        title,
        model,
        workerId: worker.id,
        createdAt: new Date(),
      })
    )

    // Navigate to current page with conversation parameters to select the new conversation
    const params = new URLSearchParams(location.search)
    params.set('workerId', worker.id)
    params.set('conversationId', conversationId)

    // Keep current pathname and add the parameters
    navigate(`${location.pathname}?${params.toString()}`)

    console.log(
      `Created conversation ${conversationId} with worker ${worker.name} using model ${model}`
    )
  }

  useEffect(() => {
    const loadAssignedProjects = async () => {
      try {
        const [workerProjects, allProjects] = await Promise.all([
          store.query(getWorkerProjects$(worker.id)),
          store.query(getProjects$),
        ])

        const assignedProjectIds = new Set(workerProjects.map(wp => wp.projectId))
        const assigned = allProjects.filter(project => assignedProjectIds.has(project.id))
        setAssignedProjects(assigned)
      } catch (error) {
        console.error('Error loading assigned projects:', error)
      }
    }

    loadAssignedProjects()
  }, [worker.id, store])

  return (
    <div
      className='bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200'
      onClick={onClick}
    >
      <div className='flex items-center mb-3'>
        <div className='w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center text-lg font-medium mr-3'>
          {worker.avatar || '🤖'}
        </div>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>{worker.name}</h3>
          {worker.roleDescription && (
            <p className='text-sm text-gray-600'>{worker.roleDescription}</p>
          )}
        </div>
      </div>

      <div className='text-sm text-gray-500 mb-3'>
        <p>Created: {formatDate(worker.createdAt)}</p>
        <p>Status: {worker.isActive ? 'Active' : 'Inactive'}</p>
        <p>Projects: {assignedProjects.length > 0 ? assignedProjects.length : 'None assigned'}</p>
        <p>Model: {getModelById(worker.defaultModel || DEFAULT_MODEL)?.name || 'Unknown'}</p>
      </div>

      {assignedProjects.length > 0 && (
        <div className='mb-3'>
          <div className='text-xs text-gray-500 mb-1'>Assigned Projects:</div>
          <div className='flex flex-wrap gap-1'>
            {assignedProjects.slice(0, 3).map(project => (
              <span
                key={project.id}
                className='inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full'
              >
                {project.name}
              </span>
            ))}
            {assignedProjects.length > 3 && (
              <span className='inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full'>
                +{assignedProjects.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <div className='flex gap-2'>
        <button
          onClick={handleChatClick}
          className='flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors'
        >
          Chat
        </button>
        <button
          onClick={e => {
            e.stopPropagation()
            setIsEditModalOpen(true)
          }}
          className='flex-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors'
        >
          Edit
        </button>
      </div>

      <EditWorkerModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        worker={worker}
      />
    </div>
  )
}
