import React, { useState, useEffect } from 'react'
import { useStore } from '@livestore/react'
import { events } from '@work-squared/shared/schema'
import { systemPromptTemplates } from '../../../util/workerNames.js'
import { ProjectAssignmentModal } from '../../ProjectAssignmentModal.js'
import { ModelSelector } from '../../ui/ModelSelector/ModelSelector.js'
import { DEFAULT_MODEL } from '../../../util/models.js'
import type { Worker } from '@work-squared/shared/schema'
import { EmojiPicker } from '../EmojiPicker/EmojiPicker.js'

interface EditWorkerModalProps {
  isOpen: boolean
  onClose: () => void
  worker: Worker
}

export const EditWorkerModal: React.FC<EditWorkerModalProps> = ({ isOpen, onClose, worker }) => {
  const { store } = useStore()
  const [name, setName] = useState(worker.name)
  const [roleDescription, setRoleDescription] = useState(worker.roleDescription || '')
  const [systemPrompt, setSystemPrompt] = useState(worker.systemPrompt)
  const [avatar, setAvatar] = useState(worker.avatar || '🤖')
  const [defaultModel, setDefaultModel] = useState(worker.defaultModel || DEFAULT_MODEL)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ name?: string; systemPrompt?: string }>({})
  const [isProjectAssignmentOpen, setIsProjectAssignmentOpen] = useState(false)

  // Update form fields when worker changes
  useEffect(() => {
    if (isOpen) {
      setName(worker.name)
      setRoleDescription(worker.roleDescription || '')
      setSystemPrompt(worker.systemPrompt)
      setAvatar(worker.avatar || '🤖')
      setDefaultModel(worker.defaultModel || DEFAULT_MODEL)
      setSelectedTemplate('')
      setErrors({})
    }
  }, [isOpen, worker])

  const validateForm = () => {
    const newErrors: { name?: string; systemPrompt?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Worker name is required'
    }

    if (!systemPrompt.trim()) {
      newErrors.systemPrompt = 'System prompt is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const updates: Record<string, any> = {}

      // Only include fields that have changed
      if (name.trim() !== worker.name) {
        updates.name = name.trim()
      }
      if (roleDescription.trim() !== (worker.roleDescription || '')) {
        updates.roleDescription = roleDescription.trim() || null
      }
      if (systemPrompt.trim() !== worker.systemPrompt) {
        updates.systemPrompt = systemPrompt.trim()
      }
      if (avatar.trim() !== (worker.avatar || '🤖')) {
        updates.avatar = avatar.trim() || null
      }
      if (defaultModel !== (worker.defaultModel || DEFAULT_MODEL)) {
        updates.defaultModel = defaultModel
      }

      // Only emit event if there are actual changes
      if (Object.keys(updates).length > 0) {
        store.commit(
          events.workerUpdated({
            id: worker.id,
            updates,
            updatedAt: new Date(),
          })
        )
      }

      onClose()
    } catch (error) {
      console.error('Error updating worker:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    // Reset form to original values
    setName(worker.name)
    setRoleDescription(worker.roleDescription || '')
    setSystemPrompt(worker.systemPrompt)
    setAvatar(worker.avatar || '🤖')
    setDefaultModel(worker.defaultModel || DEFAULT_MODEL)
    setSelectedTemplate('')
    setErrors({})
    onClose()
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value
    setSelectedTemplate(templateName)

    if (templateName) {
      const template = systemPromptTemplates.find(t => t.name === templateName)
      if (template) {
        setSystemPrompt(template.prompt)
      }
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
    if (errors.name) {
      setErrors({ ...errors, name: undefined })
    }
  }

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(e.target.value)
    if (errors.systemPrompt) {
      setErrors({ ...errors, systemPrompt: undefined })
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  return (
    <div
      className='fixed inset-0 backdrop-blur-sm flex items-start justify-center pt-5 px-4 z-[9999]'
      onClick={handleBackdropClick}
    >
      <div className='bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='flex items-start justify-between p-6 border-b border-gray-200'>
          <h3 className='text-lg font-semibold leading-6 text-gray-900'>Edit Worker</h3>
          <button
            onClick={handleClose}
            className='text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100'
            aria-label='Close modal'
          >
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Worker Name */}
            <div>
              <label htmlFor='worker-name' className='block text-sm font-medium text-gray-900 mb-2'>
                Name *
              </label>
              <input
                type='text'
                id='worker-name'
                value={name}
                onChange={handleNameChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Enter worker name'
                autoFocus
              />
              {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name}</p>}
            </div>

            {/* Role Description */}
            <div>
              <label
                htmlFor='role-description'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Role Description
              </label>
              <input
                type='text'
                id='role-description'
                value={roleDescription}
                onChange={e => setRoleDescription(e.target.value)}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='e.g., Frontend Developer, Project Manager'
              />
            </div>

            {/* Avatar */}
            <div>
              <label htmlFor='avatar' className='block text-sm font-medium text-gray-900 mb-2'>
                Avatar (emoji)
              </label>
              <EmojiPicker value={avatar} onChange={setAvatar} className='w-full' id='avatar' />
            </div>

            {/* Default Model */}
            <div>
              <label
                htmlFor='default-model'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                Default Model
              </label>
              <ModelSelector
                selectedModel={defaultModel}
                onModelChange={setDefaultModel}
                className='w-full'
              />
              <p className='mt-1 text-sm text-gray-500'>
                This model will be used by default for new conversations with this worker. Users can
                still change the model per conversation.
              </p>
            </div>

            {/* System Prompt Template */}
            <div>
              <label htmlFor='template' className='block text-sm font-medium text-gray-900 mb-2'>
                System Prompt Template
              </label>
              <select
                id='template'
                value={selectedTemplate}
                onChange={handleTemplateChange}
                className='w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              >
                <option value=''>Select a template...</option>
                {systemPromptTemplates.map(template => (
                  <option key={template.name} value={template.name}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>

            {/* System Prompt */}
            <div>
              <label
                htmlFor='system-prompt'
                className='block text-sm font-medium text-gray-900 mb-2'
              >
                System Prompt *
              </label>
              <textarea
                id='system-prompt'
                rows={6}
                value={systemPrompt}
                onChange={handleSystemPromptChange}
                className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical min-h-[150px] ${
                  errors.systemPrompt ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder='Define how this worker should behave and respond to user queries...'
              />
              {errors.systemPrompt && (
                <p className='mt-1 text-sm text-red-600'>{errors.systemPrompt}</p>
              )}
            </div>

            {/* Project Assignment */}
            <div className='pt-4 border-t border-gray-200'>
              <button
                type='button'
                onClick={() => setIsProjectAssignmentOpen(true)}
                className='w-full px-4 py-3 text-sm bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center justify-center space-x-2'
              >
                <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                  />
                </svg>
                <span>Assign to Projects</span>
              </button>
            </div>

            {/* Actions */}
            <div className='flex justify-end space-x-3 pt-4'>
              <button
                type='button'
                onClick={handleClose}
                className='px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={isSubmitting}
                className='px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors'
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ProjectAssignmentModal
        isOpen={isProjectAssignmentOpen}
        onClose={() => setIsProjectAssignmentOpen(false)}
        worker={worker}
      />
    </div>
  )
}
