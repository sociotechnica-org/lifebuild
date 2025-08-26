import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '@livestore/react'
import { Project } from '@work-squared/shared/schema'
import {
  getContactById$,
  getContactProjects$,
  getProjects$,
} from '@work-squared/shared/queries'
import { useContacts } from '../../hooks/useContacts'
import { EditContactModal } from './EditContactModal'
import { ProjectPicker } from './ProjectPicker'

export const ContactDetail: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>()
  const navigate = useNavigate()
  const { deleteContact } = useContacts()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showProjectPicker, setShowProjectPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const contact = useStore(getContactById$(contactId!))
  const projectContactJunctions = useStore(getContactProjects$(contactId!))
  const allProjects = useStore(getProjects$)

  // Map junction data to actual projects
  const projectIds = new Set(projectContactJunctions.map(pc => pc.projectId))
  const projects = allProjects.filter(p => projectIds.has(p.id))

  if (!contact || contact.length === 0) {
    return (
      <div className='flex items-center justify-center h-64'>
        <p className='text-gray-500'>Contact not found</p>
      </div>
    )
  }

  const currentContact = contact[0]

  const handleDelete = async () => {
    if (confirmDelete) {
      await deleteContact(currentContact.id)
      navigate('/contacts')
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const handleRemoveFromProject = async (projectId: string) => {
    const { mutate } = useStore.store()
    await mutate([
      {
        type: 'v1.ProjectContactRemoved',
        projectId,
        contactId: currentContact.id,
      },
    ])
  }

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <div className='bg-white shadow rounded-lg'>
        <div className='px-6 py-4 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-xl font-semibold text-gray-900'>{currentContact.name}</h2>
              <p className='text-sm text-gray-500 mt-1'>{currentContact.email}</p>
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={() => setShowEditModal(true)}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50'
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                  confirmDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {confirmDelete ? 'Click to confirm' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        <div className='px-6 py-4'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium text-gray-900'>Associated Projects</h3>
            <button
              onClick={() => setShowProjectPicker(true)}
              className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700'
            >
              Add to Project
            </button>
          </div>

          {projects.length === 0 ? (
            <p className='text-gray-500 py-4'>Not associated with any projects yet.</p>
          ) : (
            <div className='space-y-2'>
              {projects.map((project: Project) => (
                <div
                  key={project.id}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{project.name}</p>
                    {project.description && (
                      <p className='text-sm text-gray-500'>{project.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveFromProject(project.id)}
                    className='text-sm text-red-600 hover:text-red-800'
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <EditContactModal contact={currentContact} onClose={() => setShowEditModal(false)} />
      )}

      {showProjectPicker && (
        <ProjectPicker
          contactId={currentContact.id}
          existingProjectIds={projects.map((p: Project) => p.id)}
          onClose={() => setShowProjectPicker(false)}
        />
      )}
    </div>
  )
}
